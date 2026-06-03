<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\StudentAnswer;
use App\Models\StudentExamSession;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Result::with(['user:id,name,email', 'exam:id,title,passing_score', 'session:id,attempt_number,tab_switches'])
            ->when($request->exam_id, fn($q) => $q->where('exam_id', $request->exam_id))
            ->when($request->search, fn($q) => $q->whereHas('user', fn($uq) => $uq->where('name', 'like', "%{$request->search}%")))
            ->when($request->passed !== null, fn($q) => $q->where('passed', $request->boolean('passed')));

        if ($user->isInstructor()) {
            $query->whereHas('exam', fn($eq) => $eq->where('instructor_id', $user->id));
        } elseif ($user->isStudent()) {
            $query->where('user_id', $user->id);
            // Hide results if not allowed by instructor/settings (optional but we can filter details in review)
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function show(Request $request, Result $result)
    {
        $user = $request->user();
        if ((int) $result->user_id !== (int) $user->id && !$user->isInstructor() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $result->load(['user:id,name,email', 'exam:id,title,description,settings', 'session:id,started_at,submitted_at,tab_switches,attempt_number']);

        // Check if review is allowed
        $allowReview = data_get($result->exam->settings, 'allow_review', true);
        if ($user->isStudent() && !$allowReview) {
            return response()->json([
                'result' => $result,
                'message' => 'Review of detailed answers is disabled for this exam.'
            ]);
        }

        // Get detailed question-by-question response details
        $answers = StudentAnswer::where('session_id', $result->session_id)
            ->with('question')
            ->get();

        return response()->json([
            'result' => $result,
            'answers' => $answers
        ]);
    }

    public function gradeShortAnswer(Request $request, StudentAnswer $answer)
    {
        $user = $request->user();
        $session = $answer->session;
        $exam = $session->exam;

        if (!$user->isInstructor() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->isInstructor() && (int) $exam->instructor_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'marks_awarded' => "required|integer|min:0|max:{$answer->question->marks}",
            'is_correct'    => 'required|boolean',
        ]);

        DB::transaction(function () use ($answer, $data, $session) {
            $answer->update([
                'marks_awarded' => $data['marks_awarded'],
                'is_correct'    => $data['is_correct'],
                'reviewed_at'   => now(),
            ]);

            // Re-calculate the overall exam score now that one short answer is graded
            $this->recalculateSessionScore($session);
        });

        AuditLog::record('exam.short_answer_graded', $answer, $data);

        return response()->json([
            'success' => true,
            'answer' => $answer->fresh()
        ]);
    }

    private function recalculateSessionScore(StudentExamSession $session): void
    {
        $answers = StudentAnswer::where('session_id', $session->id)->get();
        $totalMarks = $answers->sum('marks_awarded');
        $maxMarks = $session->exam->totalMarks();
        $percentage = $maxMarks > 0 ? ($totalMarks / $maxMarks) * 100 : 0;
        $passed = $percentage >= $session->exam->passing_score;

        // Check if there are any remaining ungraded short answers
        $hasUngraded = StudentAnswer::where('session_id', $session->id)
            ->whereNull('is_correct')
            ->exists();

        $sessionStatus = $hasUngraded ? 'grading' : 'graded';

        $session->update(['status' => $sessionStatus]);

        Result::updateOrCreate(
            ['session_id' => $session->id],
            [
                'user_id' => $session->user_id,
                'exam_id' => $session->exam_id,
                'total_marks' => $totalMarks,
                'max_marks' => $maxMarks,
                'percentage' => round($percentage, 2),
                'passed' => $passed,
                'graded_at' => $hasUngraded ? null : now(),
            ]
        );

        if (!$hasUngraded && $passed) {
            // Dispatch certificate generation
            \App\Jobs\GenerateCertificateJob::dispatch($session->result);
        }
    }
}
