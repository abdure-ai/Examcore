<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'exam_id', 'type', 'category', 'content',
        'options', 'correct_answer', 'difficulty',
        'marks', 'display_order', 'explanation',
    ];

    protected $casts = [
        'options' => 'array',
        'marks'   => 'integer',
        'display_order' => 'integer',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function answers()
    {
        return $this->hasMany(StudentAnswer::class);
    }

    /** Check if a given raw answer is correct (MCQ / TF only) */
    public function isAnswerCorrect(string|null $answer): bool
    {
        if ($this->type === 'SA') return false;

        $stored = strtolower(trim($this->correct_answer ?? ''));
        $given  = strtolower(trim($answer ?? ''));

        // Direct match — both index ("0") or both text ("true"/"false")
        if ($stored === $given) return true;

        // MCQ: correct_answer stored as option text (CSV import) but student
        // saved a numeric index → resolve the index to text and compare.
        if ($this->type === 'MCQ' && is_array($this->options) && is_numeric($given)) {
            $optionText = strtolower(trim($this->options[(int) $given] ?? ''));
            return $optionText !== '' && $optionText === $stored;
        }

        // MCQ: correct_answer stored as index but student saved option text (edge case)
        if ($this->type === 'MCQ' && is_array($this->options) && is_numeric($stored)) {
            $optionText = strtolower(trim($this->options[(int) $stored] ?? ''));
            return $optionText !== '' && $optionText === $given;
        }

        return false;
    }
}
