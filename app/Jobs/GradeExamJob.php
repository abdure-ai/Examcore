<?php

namespace App\Jobs;

use App\Models\StudentExamSession;
use App\Models\StudentAnswer;
use App\Models\Result;
use App\Events\ExamSubmitted;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class GradeExamJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected StudentExamSession $session;

    public function __construct(StudentExamSession $session)
    {
        $this->session = $session;
    }

    public function handle(): void
    {
        $session = $this->session;
        $exam = $session->exam;
        $questions = $exam->questions;

        DB::transaction(function () use ($session, $exam, $questions) {
            $answers = StudentAnswer::where('session_id', $session->id)->get()->keyBy('question_id');
            
            $totalMarks = 0;
            $maxMarks = 0;
            $hasShortAnswer = false;

            foreach ($questions as $q) {
                $maxMarks += $q->marks;
                $ans = $answers->get($q->id);

                if ($q->type === 'SA') {
                    // Short answers cannot be graded instantly, flag for manual review
                    $hasShortAnswer = true;
                    if ($ans) {
                        $ans->update([
                            'is_correct' => null,
                            'marks_awarded' => 0
                        ]);
                    }
                } else {
                    // MCQ or TF: Grade instantly
                    $isCorrect = false;
                    $marksAwarded = 0;

                    if ($ans && $q->isAnswerCorrect($ans->answer)) {
                        $isCorrect = true;
                        $marksAwarded = $q->marks;
                        $totalMarks += $marksAwarded;
                    }

                    if ($ans) {
                        $ans->update([
                            'is_correct' => $isCorrect,
                            'marks_awarded' => $marksAwarded,
                            'reviewed_at' => now(),
                        ]);
                    }
                }
            }

            $percentage = $maxMarks > 0 ? ($totalMarks / $maxMarks) * 100 : 0;
            $passed = $percentage >= $exam->passing_score;
            
            $sessionStatus = $hasShortAnswer ? 'grading' : 'graded';
            $session->update(['status' => $sessionStatus]);

            $result = Result::updateOrCreate(
                ['session_id' => $session->id],
                [
                    'user_id' => $session->user_id,
                    'exam_id' => $session->exam_id,
                    'total_marks' => $totalMarks,
                    'max_marks' => $maxMarks,
                    'percentage' => round($percentage, 2),
                    'passed' => $passed,
                    'graded_at' => $hasShortAnswer ? null : now(),
                ]
            );

            // Broadcast real-time exam completion/status event (non-fatal if Pusher is unavailable)
            try {
                broadcast(new ExamSubmitted($session));
            } catch (\Throwable $e) {
                \Log::warning('ExamSubmitted broadcast skipped: ' . $e->getMessage());
            }

            // If fully graded and student passed, generate certificate
            if (!$hasShortAnswer && $passed) {
                GenerateCertificateJob::dispatch($result);
            }

            // Notify student via email
            SendResultEmailJob::dispatch($result);
        });
    }
}
