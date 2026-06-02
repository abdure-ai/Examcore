<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentExamSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'exam_id', 'attempt_number', 'status',
        'started_at', 'expires_at', 'submitted_at',
        'question_order', 'tab_switches', 'ip_address',
    ];

    protected $casts = [
        'started_at'     => 'datetime',
        'expires_at'     => 'datetime',
        'submitted_at'   => 'datetime',
        'question_order' => 'array',
        'tab_switches'   => 'integer',
    ];

    public function user()      { return $this->belongsTo(User::class); }
    public function exam()      { return $this->belongsTo(Exam::class); }
    public function answers()   { return $this->hasMany(StudentAnswer::class, 'session_id'); }
    public function result()    { return $this->hasOne(Result::class, 'session_id'); }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast() && $this->status === 'in_progress';
    }

    public function remainingSeconds(): int
    {
        return max(0, now()->diffInSeconds($this->expires_at, false));
    }
}
