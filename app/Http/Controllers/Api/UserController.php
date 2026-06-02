<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('roles')
            ->when($request->role, fn($q) => $q->role($request->role))
            ->when($request->search, fn($q) => $q->where(function ($q2) use ($request) {
                $q2->where('name', 'like', "%{$request->search}%")
                   ->orWhere('username', 'like', "%{$request->search}%")
                   ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->is_active !== null, fn($q) => $q->where('is_active', $request->boolean('is_active')));

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:50|alpha_num|unique:users',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:super_admin,instructor,student',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'username' => $data['username'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
        $user->assignRole($data['role']);
        AuditLog::record('user.created', $user);

        return response()->json($user->load('roles'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load(['roles', 'groups:id,name', 'results.exam']));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'username' => "sometimes|string|max:50|alpha_num|unique:users,username,{$user->id}",
            'email'    => "sometimes|email|unique:users,email,{$user->id}",
            'password' => 'sometimes|string|min:8',
            'role'     => 'sometimes|in:super_admin,instructor,student',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
            unset($data['role']);
        }

        $user->update($data);
        AuditLog::record('user.updated', $user, array_keys($data));

        return response()->json($user->load('roles'));
    }

    public function destroy(User $user)
    {
        $user->delete();
        AuditLog::record('user.deleted', $user);
        return response()->json(['message' => 'User deleted.']);
    }

    public function toggleActive(User $user)
    {
        $user->update(['is_active' => ! $user->is_active]);
        AuditLog::record('user.toggled_active', $user, ['is_active' => $user->is_active]);
        return response()->json(['is_active' => $user->is_active]);
    }

    public function uploadAvatar(Request $request, User $user)
    {
        $request->validate(['avatar' => 'required|image|max:2048']);
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);
        return response()->json(['avatar_url' => $user->avatarUrl()]);
    }

    // ── Group Assignment (admin side) ─────────────────────────────────────────

    public function syncGroups(Request $request, User $user)
    {
        $data = $request->validate([
            'group_ids'   => 'required|array',
            'group_ids.*' => 'exists:groups,id',
        ]);

        // Keep instructor-owned pivot records intact; only sync for this user
        $user->groups()->sync($data['group_ids']);
        AuditLog::record('user.groups_synced', $user, ['group_ids' => $data['group_ids']]);

        return response()->json(['message' => 'Groups updated.', 'groups' => $user->groups()->get(['groups.id', 'name'])]);
    }

    // ── Bulk Import ───────────────────────────────────────────────────────────

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="users_template.csv"',
            'Cache-Control'       => 'no-cache',
        ];

        $rows = [
            ['name', 'username', 'email', 'password', 'role'],
            ['John Student', 'johnstudent', 'john@example.com', 'password123', 'student'],
            ['Jane Instructor', 'janeinst', 'jane@example.com', 'password123', 'instructor'],
            ['Bob Admin', 'bobadmin', 'bob@example.com', 'password123', 'super_admin'],
        ];

        $callback = function () use ($rows) {
            $handle = fopen('php://output', 'w');
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function bulkImport(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt']);

        $content = file_get_contents($request->file('file')->getRealPath());
        $content = ltrim($content, "\xEF\xBB\xBF");
        if (!mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
        }
        $content = str_replace(["\r\n", "\r"], "\n", $content);
        $lines   = array_filter(explode("\n", $content), fn($l) => trim($l) !== '');
        $data    = array_map('str_getcsv', array_values($lines));
        array_shift($data); // remove header

        $imported = 0;
        $errors   = [];

        foreach ($data as $i => $row) {
            $row = array_map(fn($v) => mb_convert_encoding(trim((string) $v), 'UTF-8', 'UTF-8'), $row);
            if (count($row) < 5) continue;

            [$name, $username, $email, $password, $role] = $row;

            if (!in_array($role, ['student', 'instructor', 'super_admin'])) {
                $role = 'student';
            }

            if (User::where('email', $email)->orWhere('username', $username)->exists()) {
                $errors[] = "Row " . ($i + 2) . ": username '$username' or email '$email' already exists.";
                continue;
            }

            $user = User::create([
                'name'     => $name,
                'username' => $username,
                'email'    => $email,
                'password' => Hash::make($password),
                'is_active' => true,
            ]);
            $user->assignRole($role);
            $imported++;
        }

        AuditLog::record('users.bulk_imported', null, ['count' => $imported]);

        return response()->json([
            'message' => "Successfully imported {$imported} users.",
            'errors'  => $errors,
        ]);
    }
}
