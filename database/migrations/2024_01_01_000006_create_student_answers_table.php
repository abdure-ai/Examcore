<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ERD: student_answers
 * ─────────────────────────────────────────────────
 * Stores each answer a student gave per question
 * within a session.
 * answer: raw student input (option index for MCQ,
 *         "true"|"false" for TF, free text for SA)
 * is_correct: populated by GradeExamJob (NULL if SA pending)
 * marks_awarded: 0 or question.marks
 * reviewed_at: when instructor manually graded SA answer
 * ─────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                  ->constrained('student_exam_sessions')
                  ->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->text('answer')->nullable();              // student's raw answer
            $table->boolean('is_flagged')->default(false);  // flagged for review by student
            $table->boolean('is_correct')->nullable();      // null = not yet graded (SA)
            $table->unsignedSmallInteger('marks_awarded')->default(0);
            $table->timestamp('reviewed_at')->nullable();   // SA manual review timestamp
            $table->timestamps();

            // Indexes
            $table->index('session_id');
            $table->index('question_id');
            $table->unique(['session_id', 'question_id']); // one answer per question per session
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_answers');
    }
};
