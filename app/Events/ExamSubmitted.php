<?php

namespace App\Events;

use App\Models\StudentExamSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExamSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public StudentExamSession $session;

    public function __construct(StudentExamSession $session)
    {
        $this->session = $session;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("exams.{$this->session->exam_id}"),
            new PrivateChannel("instructor.{$this->session->exam->instructor_id}"),
        ];
    }

    public function broadcastWith(): array
    {
        $this->session->load('user:id,name,email');
        return [
            'session_id' => $this->session->id,
            'student_name' => $this->session->user->name,
            'exam_title' => $this->session->exam->title,
            'status' => $this->session->status,
            'submitted_at' => $this->session->submitted_at?->toIso8601String(),
        ];
    }
}
