<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\ExamSessionController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\AuditLogController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ── Public Routes ────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ── Authenticated Routes ───────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth endpoints
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Users (Admin/Instructor managed) — static routes BEFORE apiResource
    Route::get('users/import/template', [UserController::class, 'downloadTemplate']);
    Route::post('users/import', [UserController::class, 'bulkImport']);
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    Route::post('users/{user}/avatar', [UserController::class, 'uploadAvatar']);
    Route::put('users/{user}/groups', [UserController::class, 'syncGroups']);

    // Exams
    Route::apiResource('exams', ExamController::class);
    Route::post('exams/{exam}/assign', [ExamController::class, 'assign']);
    Route::get('exams/{exam}/analytics', [ExamController::class, 'analytics']);

    // Questions (nested under exams)
    Route::get('exams/{exam}/questions', [QuestionController::class, 'index']);
    Route::post('exams/{exam}/questions', [QuestionController::class, 'store']);
    Route::get('exams/{exam}/questions/template', [QuestionController::class, 'downloadTemplate']);
    Route::get('exams/{exam}/questions/{question}', [QuestionController::class, 'show']);
    Route::put('exams/{exam}/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('exams/{exam}/questions/{question}', [QuestionController::class, 'destroy']);
    Route::post('exams/{exam}/questions/import', [QuestionController::class, 'bulkImport']);

    // Exam Sessions (Student Exam Taking Flow)
    Route::get('exams/{exam}/session/current', [ExamSessionController::class, 'current']);
    Route::post('exams/{exam}/session/start', [ExamSessionController::class, 'start']);
    Route::get('sessions/{session}', [ExamSessionController::class, 'show']);
    Route::post('sessions/{session}/answer', [ExamSessionController::class, 'saveAnswer']);
    Route::post('sessions/{session}/submit', [ExamSessionController::class, 'submit']);
    Route::post('sessions/{session}/cheat', [ExamSessionController::class, 'auditCheat']);

    // Results
    Route::get('results', [ResultController::class, 'index']);
    Route::get('results/{result}', [ResultController::class, 'show']);
    Route::post('answers/{answer}/grade', [ResultController::class, 'gradeShortAnswer']);

    // Certificates
    Route::get('certificates', [CertificateController::class, 'index']);
    Route::get('certificates/{certificate}/download', [CertificateController::class, 'download'])->name('api.certificates.download');
    Route::post('results/{result}/certificate/generate', [CertificateController::class, 'triggerGeneration']);

    // Groups
    Route::apiResource('groups', GroupController::class);
    Route::post('groups/{group}/assign', [GroupController::class, 'assignStudents']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::put('notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);

    // System Settings & Audit Logs (Super Admin only)
    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings', [SettingController::class, 'update']);
    Route::get('audit-logs', [AuditLogController::class, 'index']);
});
