<?php

namespace App\Jobs;

use App\Models\Exam;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendExamReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Exam $exam;
    protected User $user;

    public function __construct(Exam $exam, User $user)
    {
        $this->exam = $exam;
        $this->user = $user;
    }

    public function handle(): void
    {
        $exam = $this->exam;
        $user = $this->user;

        Mail::send([], [], function ($message) use ($user, $exam) {
            $formattedStart = $exam->start_at->format('F d, Y h:i A');
            $html = "
                <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;'>
                    <h2 style='color: #4f46e5; margin-bottom: 20px;'>Upcoming Exam Reminder</h2>
                    <p>Hello <strong>{$user->name}</strong>,</p>
                    <p>This is a reminder that you have an upcoming exam scheduled: <strong>{$exam->title}</strong>.</p>
                    
                    <div style='margin: 25px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #4f46e5; border-radius: 4px;'>
                        <p style='margin: 5px 0;'><strong>Date/Time:</strong> {$formattedStart}</p>
                        <p style='margin: 5px 0;'><strong>Duration:</strong> {$exam->duration_minutes} minutes</p>
                        <p style='margin: 5px 0;'><strong>Attempts Allowed:</strong> {$exam->max_attempts}</p>
                    </div>

                    <p>Please make sure you have a stable internet connection and are in a distraction-free environment before starting.</p>
                    <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;' />
                    <p style='font-size: 12px; color: #6b7280; text-align: center;'>Online Exam System Admin</p>
                </div>
            ";

            $message->to($user->email)
                ->subject("Reminder: Upcoming Exam {$exam->title}")
                ->html($html);
        });
    }
}
