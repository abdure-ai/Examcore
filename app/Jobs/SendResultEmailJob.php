<?php

namespace App\Jobs;

use App\Models\Result;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendResultEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Result $result;

    public function __construct(Result $result)
    {
        $this->result = $result;
    }

    public function handle(): void
    {
        $result = $this->result;
        $user = $result->user;
        $exam = $result->exam;

        // In production, we'd use a dedicated Mailable class, but for simplicity
        // and reliability, we can construct a basic HTML layout directly:
        Mail::send([], [], function ($message) use ($user, $exam, $result) {
            $statusText = $result->passed ? 'PASSED' : 'FAILED';
            $color = $result->passed ? '#22c55e' : '#ef4444';

            $html = "
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
                    <h2 style='color: #4f46e5; margin-bottom: 20px;'>Your Exam Result is Ready!</h2>
                    <p>Hello <strong>{$user->name}</strong>,</p>
                    <p>You have completed the exam: <strong>{$exam->title}</strong>.</p>
                    
                    <div style='margin: 25px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid {$color}; border-radius: 4px;'>
                        <p style='margin: 5px 0;'><strong>Status:</strong> <span style='color: {$color}; font-weight: bold;'>{$statusText}</span></p>
                        <p style='margin: 5px 0;'><strong>Your Score:</strong> {$result->percentage}%</p>
                        <p style='margin: 5px 0;'><strong>Passing Mark Required:</strong> {$exam->passing_score}%</p>
                    </div>

                    <p>You can view your detailed feedback and download certificates (if eligible) by logging into the Online Exam Portal.</p>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;' />
                    <p style='font-size: 12px; color: #6b7280; text-align: center;'>This is an automated notification from the Online Exam System. Please do not reply directly to this email.</p>
                </div>
            ";

            $message->to($user->email)
                ->subject("Exam Result: {$exam->title} ({$statusText})")
                ->html($html);
        });
    }
}
