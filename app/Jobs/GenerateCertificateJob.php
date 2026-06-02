<?php

namespace App\Jobs;

use App\Models\Result;
use App\Models\Certificate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class GenerateCertificateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Result $result;

    public function __construct(Result $result)
    {
        $this->result = $result;
    }

    public function handle(): void
    {
        $result = $this->result;
        $user = $result->user;
        $exam = $result->exam;

        // 1. Generate unique certificate number
        $year = now()->year;
        $rand = strtoupper(Str::random(6));
        $certNumber = "CERT-{$year}-{$result->id}-{$rand}";

        // 2. Prepare storage path
        $filename = "certificates/{$certNumber}.pdf";

        // 3. Render HTML to PDF
        // Pass data to view
        $pdf = Pdf::loadView('pdf.certificate', [
            'name' => $user->name,
            'examTitle' => $exam->title,
            'score' => $result->percentage,
            'date' => now()->format('F d, Y'),
            'certNumber' => $certNumber
        ])->setPaper('a4', 'landscape');

        // Ensure directories exist
        Storage::disk('public')->makeDirectory('certificates');

        // 4. Save PDF file
        Storage::disk('public')->put($filename, $pdf->output());

        // 5. Save in database
        Certificate::updateOrCreate(
            ['result_id' => $result->id],
            [
                'user_id' => $user->id,
                'certificate_number' => $certNumber,
                'pdf_path' => $filename,
                'issued_at' => now(),
            ]
        );
    }
}
