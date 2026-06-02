<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id', 'question_id', 'answer',
        'is_flagged', 'is_correct', 'marks_awarded', 'reviewed_at',
    ];

    protected $casts = [
        'is_flagged'   => 'boolean',
        'is_correct'   => 'boolean',
        'marks_awarded' => 'integer',
        'reviewed_at'  => 'datetime',
    ];

    public function session()  { return $this->belongsTo(StudentExamSession::class, 'session_id'); }
    public function question() { return $this->belongsTo(Question::class); }
}
