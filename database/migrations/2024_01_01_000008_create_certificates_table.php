<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ERD: certificates
 * ─────────────────────────────────────────────────
 * Auto-generated PDF certificate for passing students.
 * pdf_path: relative path under storage/app/public/certificates/
 * certificate_number: unique display code (e.g. CERT-2024-000123)
 * Triggered by GenerateCertificateJob after result.passed = true
 * ─────────────────────────────────────────────────
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('result_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('certificate_number')->unique();
            $table->string('pdf_path');
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamps();

            $table->index('user_id');
            $table->index('certificate_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
