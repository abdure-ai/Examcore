<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Group::withCount('students')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"));

        if ($user->isInstructor()) {
            $query->where('instructor_id', $user->id);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $group = $request->user()->groups()->create([
            'instructor_id' => $request->user()->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        AuditLog::record('group.created', $group);

        return response()->json($group, 201);
    }

    public function show(Group $group)
    {
        return response()->json($group->load('students:id,name,email'));
    }

    public function update(Request $request, Group $group)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $group->update($data);
        AuditLog::record('group.updated', $group, $data);

        return response()->json($group);
    }

    public function destroy(Group $group)
    {
        $group->delete();
        AuditLog::record('group.deleted', $group);
        return response()->json(['message' => 'Group deleted.']);
    }

    public function assignStudents(Request $request, Group $group)
    {
        $data = $request->validate([
            'student_ids'   => 'required|array',
            'student_ids.*' => 'exists:users,id',
        ]);

        $group->students()->sync($data['student_ids']);
        AuditLog::record('group.students_assigned', $group, $data);

        return response()->json(['message' => 'Students assigned to group.']);
    }
}
