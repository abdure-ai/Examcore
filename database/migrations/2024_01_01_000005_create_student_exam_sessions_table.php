<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ERD: student_exam_sessions
 * ─────────────────────────────────────────────────
 * Tracks each student's individual exam attempt.
 * One record per attempt (attempt_number increments).
 * status: in_progress | submitted | expired | grading | graded
 * expires_at: server-authoritative timer expiry (started_at + duration)
 *   — used to validate auto-submit and prevent cheating
 * question_order (JSON): randomised question ID array stored at session start
 * tab_switches: count of tab-switch events (anti-cheat audit)
 * ip_address: IP at exam start for audit
 * ─────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->enum('status', ['in_progress', 'submitted', 'expired', 'grading', 'graded'])
                  ->default('in_progress');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('expires_at');         // server-authoritative deadline
            $table->timestamp('submitted_at')->nullable();
            $table->json('question_order')->nullable(); // randomised order if enabled
            $table->unsignedSmallInteger('tab_switches')->default(0);
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            // Indexes for common queries
            $table->index('user_id');
            $table->index('exam_id');
            $table->index('status');
            $table->index(['user_id', 'exam_id']);          // fetch user's session for an exam
            $table->index('expires_at');                    // scheduler: find expired sessions
            $table->unique(['user_id', 'exam_id', 'attempt_number']); // prevent duplicate attempts
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_exam_sessions');
    }
};
