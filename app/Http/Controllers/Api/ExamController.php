<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Exam::with('instructor:id,name')
            ->withCount('questions')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"));

        if ($user->isInstructor()) {
            $query->where('instructor_id', $user->id);
        } elseif ($user->isStudent()) {
            $accessibleIds = $user->accessibleExams()->pluck('id');
            $query->whereIn('id', $accessibleIds)->published();
        }

        return response()->json($query->latest()->paginate(12));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'duration_minutes' => 'required|integer|min:1|max:480',
            'passing_score'    => 'required|integer|min:1|max:100',
            'start_at'         => 'required|date|after:now',
            'end_at'           => 'required|date|after:start_at',
            'max_attempts'     => 'required|integer|min:1|max:10',
            'status'           => 'required|in:draft,published',
            'settings'         => 'nullable|array',
            'passcode'         => 'nullable|string|max:20',
        ]);

        $exam = $request->user()->createdExams()->create($data);
        AuditLog::record('exam.created', $exam);
        return response()->json($exam, 201);
    }

    public function show(Request $request, Exam $exam)
    {
        $exam->load(['instructor:id,name', 'questions']);
        // Instructors and admins see the raw passcode; students only see has_passcode (passcode stays hidden)
        if (!$request->user()?->isStudent()) {
            $exam->makeVisible(['passcode']);
        }
        return response()->json($exam);
    }

    public function update(Request $request, Exam $exam)
    {
        $this->authorize('update', $exam);
        $data = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'description'      => 'nullable|string',
            'duration_minutes' => 'sometimes|integer|min:1|max:480',
            'passing_score'    => 'sometimes|integer|min:1|max:100',
            'start_at'         => 'sometimes|date',
            'end_at'           => 'sometimes|date|after:start_at',
            'max_attempts'     => 'sometimes|integer|min:1|max:10',
            'status'           => 'sometimes|in:draft,published,archived',
            'settings'         => 'nullable|array',
            'passcode'         => 'sometimes|nullable|string|max:20',
        ]);

        // Empty string sent explicitly means "remove passcode"
        if (array_key_exists('passcode', $data) && $data['passcode'] === '') {
            $data['passcode'] = null;
        }

        $exam->update($data);
        Cache::forget("exam:{$exam->id}:questions");
        AuditLog::record('exam.updated', $exam, array_keys($data));
        return response()->json($exam);
    }

    public function destroy(Exam $exam)
    {
        $this->authorize('delete', $exam);
        $exam->delete();
        Cache::forget("exam:{$exam->id}:questions");
        AuditLog::record('exam.deleted', $exam);
        return response()->json(['message' => 'Exam deleted.']);
    }

    public function assign(Request $request, Exam $exam)
    {
        $this->authorize('update', $exam);
        $data = $request->validate([
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:users,id',
            'group_ids'   => 'nullable|array',
            'group_ids.*' => 'exists:groups,id',
        ]);

        if (isset($data['student_ids'])) {
            $exam->assignedStudents()->sync($data['student_ids']);
        }
        if (isset($data['group_ids'])) {
            $exam->assignedGroups()->sync($data['group_ids']);
        }

        AuditLog::record('exam.assigned', $exam, $data);
        return response()->json(['message' => 'Exam assigned successfully.']);
    }

    public function analytics(Exam $exam)
    {
        $this->authorize('view', $exam);
        $results = $exam->results()->with('user:id,name,email')->get();

        return response()->json([
            'total_attempts'  => $results->count(),
            'pass_count'      => $results->where('passed', true)->count(),
            'fail_count'      => $results->where('passed', false)->count(),
            'average_score'   => round($results->avg('percentage'), 2),
            'highest_score'   => $results->max('percentage'),
            'lowest_score'    => $results->min('percentage'),
            'score_distribution' => $results->groupBy(fn($r) => (int)($r->percentage / 10) * 10)
                ->map->count(),
            'results'         => $results,
        ]);
    }
}
