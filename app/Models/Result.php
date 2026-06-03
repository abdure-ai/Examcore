<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id', 'user_id', 'exam_id',
        'total_marks', 'max_marks', 'percentage', 'passed', 'graded_at',
    ];

    protected $casts = [
        'percentage'  => 'float',
        'passed'      => 'boolean',
        'graded_at'   => 'datetime',
        'user_id'     => 'integer',
        'exam_id'     => 'integer',
        'session_id'  => 'integer',
        'total_marks' => 'integer',
        'max_marks'   => 'integer',
    ];

    public function session()     { return $this->belongsTo(StudentExamSession::class, 'session_id'); }
    public function user()        { return $this->belongsTo(User::class); }
    public function exam()        { return $this->belongsTo(Exam::class); }
    public function certificate() { return $this->hasOne(Certificate::class); }
}
