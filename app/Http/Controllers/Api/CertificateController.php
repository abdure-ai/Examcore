<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Result;
use App\Jobs\GenerateCertificateJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Certificate::with(['user:id,name', 'result.exam:id,title'])
            ->when($request->search, fn($q) => $q->whereHas('user', fn($uq) => $uq->where('name', 'like', "%{$request->search}%")));

        if ($user->isStudent()) {
            $query->where('user_id', $user->id);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function download(Request $request, Certificate $certificate)
    {
        $user = $request->user();
        if ($certificate->user_id !== $user->id && !$user->isInstructor() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!Storage::disk('public')->exists($certificate->pdf_path)) {
            // Re-generate if file missing
            GenerateCertificateJob::dispatchSync($certificate->result);
            $certificate = $certificate->fresh();
        }

        return response()->download(storage_path('app/public/' . $certificate->pdf_path));
    }

    public function triggerGeneration(Request $request, Result $result)
    {
        $user = $request->user();
        if (!$user->isInstructor() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!$result->passed) {
            return response()->json(['message' => 'Cannot generate certificate for failed result.'], 400);
        }

        GenerateCertificateJob::dispatch($result);

        return response()->json(['message' => 'Certificate generation job dispatched.']);
    }
}
