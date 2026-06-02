<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ERD: audit_logs
 * ─────────────────────────────────────────────────
 * Immutable log of all significant system actions.
 * model_type + model_id: polymorphic reference to affected entity
 * payload (JSON): before/after state or context data
 * Populated by AuditTrailMiddleware for write operations
 * and manually in critical flows (exam submit, grade, etc.)
 * ─────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');                        // e.g. "exam.submitted", "user.created"
            $table->string('model_type')->nullable();        // App\Models\Exam
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('payload')->nullable();             // request/context data
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('user_id');
            $table->index('action');
            $table->index(['model_type', 'model_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
