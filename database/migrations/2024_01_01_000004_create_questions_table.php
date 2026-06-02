<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ERD: questions
 * ─────────────────────────────────────────────────
 * Stores all question types for an exam.
 * type:
 *   - MCQ  : multiple choice — options (JSON array), correct_answer is option index
 *   - TF   : true/false — correct_answer is "true"|"false"
 *   - SA   : short answer — correct_answer is NULL (manual grading)
 * options (JSON): array of option strings for MCQ; NULL for TF/SA
 * difficulty: easy | medium | hard
 * display_order: for sorted display; randomised at runtime if exam.settings.randomize_questions
 * ─────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['MCQ', 'TF', 'SA']);
            $table->string('category')->nullable();
            $table->text('content');                           // question body (supports HTML)
            $table->json('options')->nullable();               // MCQ options array
            $table->text('correct_answer')->nullable();        // NULL for SA
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->unsignedSmallInteger('marks')->default(1); // points awarded for correct answer
            $table->unsignedSmallInteger('display_order')->default(0);
            $table->text('explanation')->nullable();           // shown during review
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('exam_id');
            $table->index('type');
            $table->index('difficulty');
            $table->index(['exam_id', 'display_order']); // ordered question fetch
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
