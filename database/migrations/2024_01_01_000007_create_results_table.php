<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ERD: results
 * ─────────────────────────────────────────────────
 * One result record per session, created by GradeExamJob.
 * total_marks: sum of marks_awarded across all answers
 * max_marks: sum of all question marks in the exam
 * percentage: (total_marks / max_marks) * 100
 * passed: percentage >= exam.passing_score
 * ─────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                  ->unique()
                  ->constrained('student_exam_sessions')
                  ->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('total_marks')->default(0);
            $table->unsignedSmallInteger('max_marks')->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->boolean('passed')->default(false);
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('exam_id');
            $table->index(['user_id', 'exam_id']);
            $table->index('passed');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
