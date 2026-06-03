<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\StudentExamSession;
use App\Models\StudentAnswer;
use App\Models\AuditLog;
use App\Jobs\GradeExamJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExamSessionController extends Controller
{
    public function start(Request $request, Exam $exam)
    {
        $user = $request->user();

        // 1. Validate window accessibility
        if (!$exam->isActive() && !$user->isInstructor() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'This exam is not active or accessible at this time.'], 403);
        }

        // 2. Validate passcode (if exam is passcode-protected)
        $storedPasscode = \DB::table('exams')->where('id', $exam->id)->value('passcode');
        if ($storedPasscode && !$user->isInstructor() && !$user->isSuperAdmin()) {
            $provided = trim($request->input('passcode', ''));
            if ($provided !== trim($storedPasscode)) {
                return response()->json(['message' => 'Incorrect exam passcode. Please try again.'], 403);
            }
        }

        // 3. Validate student assignment
        if (!$user->isInstructor() && !$user->isSuperAdmin() && !$user->accessibleExams()->where('exams.id', $exam->id)->exists()) {
            return response()->json(['message' => 'You are not assigned to this exam.'], 403);
        }

        // 3. Check attempt limit
        $attemptCount = StudentExamSession::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->count();

        if ($attemptCount >= $exam->max_attempts) {
            return response()->json(['message' => 'You have reached the maximum number of attempts for this exam.'], 403);
        }

        // 4. Check for active session in progress (to resume)
        $activeSession = StudentExamSession::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->where('status', 'in_progress')
            ->first();

        if ($activeSession) {
            if ($activeSession->isExpired()) {
                $this->autoSubmitSession($activeSession);
            } else {
                return response()->json([
                    'session' => $activeSession,
                    'message' => 'Resuming active exam session.',
                    'remaining_seconds' => $activeSession->remainingSeconds()
                ]);
            }
        }

        // 5. Create new session
        return DB::transaction(function () use ($user, $exam, $attemptCount, $request) {
            $startedAt = now();
            $expiresAt = $startedAt->copy()->addMinutes((int) $exam->duration_minutes);

            // Fetch questions and potentially randomize
            $questions = $exam->cachedQuestions();
            $questionIds = $questions->pluck('id')->toArray();

            if (data_get($exam->settings, 'randomize_questions', false)) {
                shuffle($questionIds);
            }

            $session = StudentExamSession::create([
                'user_id' => $user->id,
                'exam_id' => $exam->id,
                'attempt_number' => $attemptCount + 1,
                'status' => 'in_progress',
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'question_order' => $questionIds,
                'ip_address' => $request->ip(),
            ]);

            AuditLog::record('exam.session_started', $session, ['attempt' => $session->attempt_number]);

            return response()->json([
                'session' => $session,
                'message' => 'Exam session started.',
                'remaining_seconds' => $session->remainingSeconds()
            ], 201);
        });
    }

    public function show(Request $request, StudentExamSession $session)
    {
        $user = $request->user();
        if ((int) $session->user_id !== (int) $user->id && !$user->isInstructor() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized access to session.'], 403);
        }

        // Check if session has expired during inactivity
        if ($session->isExpired()) {
            $this->autoSubmitSession($session);
            return response()->json([
                'session' => $session->fresh(),
                'message' => 'Session expired and auto-submitted.'
            ]);
        }

        $exam = $session->exam;
        $questions = $exam->cachedQuestions();

        // Re-order questions based on session order if stored
        if ($session->question_order) {
            $orderMap = array_flip($session->question_order);
            $questions = $questions->sortBy(function ($q) use ($orderMap) {
                return $orderMap[$q->id] ?? 999;
            })->values();
        }

        // Prepare student answers mapping
        $savedAnswers = StudentAnswer::where('session_id', $session->id)
            ->get()
            ->keyBy('question_id');

        // Strip correct answers if student is currently taking exam to prevent cheating
        $questionsData = $questions->map(function ($q) use ($savedAnswers, $exam) {
            $ans = $savedAnswers->get($q->id);
            $qArr = [
                'id' => $q->id,
                'type' => $q->type,
                'category' => $q->category,
                'content' => $q->content,
                'options' => $q->options,
                'difficulty' => $q->difficulty,
                'marks' => $q->marks,
                'saved_answer' => $ans?->answer,
                'is_flagged' => $ans?->is_flagged ?? false,
            ];

            // Randomize options for student if set
            if ($q->type === 'MCQ' && data_get($exam->settings, 'randomize_options', false) && is_array($qArr['options'])) {
                shuffle($qArr['options']);
            }

            return $qArr;
        });

        return response()->json([
            'session' => $session,
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'description' => $exam->description,
                'settings' => $exam->settings,
            ],
            'questions' => $questionsData,
            'remaining_seconds' => $session->remainingSeconds()
        ]);
    }

    public function saveAnswer(Request $request, StudentExamSession $session)
    {
        $user = $request->user();
        if ((int) $session->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($session->status !== 'in_progress') {
            return response()->json(['message' => 'Cannot modify a completed or expired session.'], 400);
        }

        if ($session->isExpired()) {
            $this->autoSubmitSession($session);
            return response()->json(['message' => 'Session expired and auto-submitted.'], 400);
        }

        $data = $request->validate([
            'question_id' => 'required|exists:questions,id',
            'answer'      => 'nullable|string',
            'is_flagged'  => 'sometimes|boolean',
        ]);

        $answer = StudentAnswer::updateOrCreate(
            ['session_id' => $session->id, 'question_id' => $data['question_id']],
            [
                'answer' => $data['answer'] ?? null,
                'is_flagged' => $data['is_flagged'] ?? false,
            ]
        );

        return response()->json([
            'success' => true,
            'answer' => $answer
        ]);
    }

    public function submit(Request $request, StudentExamSession $session)
    {
        $user = $request->user();
        if ((int) $session->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($session->status !== 'in_progress') {
            return response()->json(['message' => 'Session already submitted.'], 400);
        }

        $isExpired = $session->isExpired();
        
        // Log anti-cheat audit data if submitted
        if ($request->has('tab_switches')) {
            $session->increment('tab_switches', (int) $request->tab_switches);
        }

        DB::transaction(function () use ($session, $isExpired) {
            $session->update([
                'status'       => $isExpired ? 'expired' : 'submitted',
                'submitted_at' => now(),
            ]);
            AuditLog::record($isExpired ? 'exam.session_expired' : 'exam.session_submitted', $session);
        });

        // Grade synchronously — no queue worker required
        GradeExamJob::dispatchSync($session->fresh());

        return response()->json([
            'message' => $isExpired ? 'Exam expired and submitted.' : 'Exam submitted successfully.',
            'session' => $session->fresh(),
            'result'  => $session->fresh()->result,
        ]);
    }

    public function auditCheat(Request $request, StudentExamSession $session)
    {
        $user = $request->user();
        if ((int) $session->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'action' => 'required|in:tab_switch,fullscreen_exit,copy_paste_attempt'
        ]);

        if ($request->action === 'tab_switch') {
            $session->increment('tab_switches');
        }

        AuditLog::record("exam.anti_cheat_{$request->action}", $session, [
            'current_tab_switches' => $session->tab_switches
        ]);

        return response()->json([
            'success' => true,
            'tab_switches' => $session->tab_switches
        ]);
    }

    public function current(Request $request, Exam $exam)
    {
        $user = $request->user();

        $session = StudentExamSession::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->latest()
            ->first();

        $attemptCount = StudentExamSession::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->count();

        return response()->json([
            'session'       => $session ? $session->load('result') : null,
            'attempt_count' => $attemptCount,
            'can_attempt'   => $attemptCount < $exam->max_attempts && $exam->isActive(),
        ]);
    }

    private function autoSubmitSession(StudentExamSession $session): void
    {
        DB::transaction(function () use ($session) {
            $session->update([
                'status'       => 'expired',
                'submitted_at' => $session->expires_at,
            ]);
            AuditLog::record('exam.session_auto_submitted', $session);
        });
        GradeExamJob::dispatchSync($session->fresh());
    }
}
