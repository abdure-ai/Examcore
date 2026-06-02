<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ERD: exams
 * ─────────────────────────────────────────────────
 * Central exam entity. Created by instructors.
 * settings (JSON): stores per-exam config such as:
 *   - question_display: 'one_per_page' | 'all_in_one'
 *   - randomize_questions: bool
 *   - randomize_options: bool
 *   - allow_review: bool
 *   - show_results_immediately: bool
 *   - anti_cheat: { tab_switch: bool, fullscreen: bool, copy_paste: bool }
 * status: draft | published | archived
 * ─────────────────────────────────────────────────
 * Relationships:
 *   exams →(belongs_to)→ users (instructor)
 *   exams →(many-to-many)→ users (students) via exam_student
 *   exams →(many-to-many)→ groups via exam_group
 * ─────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration_minutes'); // exam duration in minutes
            $table->unsignedTinyInteger('passing_score');     // percentage 0-100
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->unsignedTinyInteger('max_attempts')->default(1);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->json('settings')->nullable();            // per-exam config (see ERD above)
            $table->timestamps();
            $table->softDeletes();

            // Indexes for common queries
            $table->index('instructor_id');
            $table->index('status');
            $table->index(['start_at', 'end_at']); // time-window lookups
            $table->index('slug');
        });

        // ── exam_student: direct student assignment ───────────────────────
        Schema::create('exam_student', function (Blueprint $table) {
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['exam_id', 'user_id']);
        });

        // ── exam_group: group-level assignment ────────────────────────────
        Schema::create('exam_group', function (Blueprint $table) {
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->primary(['exam_id', 'group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_group');
        Schema::dropIfExists('exam_student');
        Schema::dropIfExists('exams');
    }
};
