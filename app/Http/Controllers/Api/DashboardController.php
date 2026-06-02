<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Exam;
use App\Models\Result;
use App\Models\StudentExamSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return response()->json($this->superAdminStats());
        }
        if ($user->isInstructor()) {
            return response()->json($this->instructorStats($user));
        }
        return response()->json($this->studentStats($user));
    }

    private function superAdminStats(): array
    {
        return [
            'total_users'       => User::count(),
            'total_students'    => User::role('student')->count(),
            'total_instructors' => User::role('instructor')->count(),
            'total_exams'       => Exam::count(),
            'active_sessions'   => StudentExamSession::where('status', 'in_progress')->count(),
            'total_results'     => Result::count(),
            'pass_rate'         => round(Result::where('passed', true)->count() / max(1, Result::count()) * 100, 1),
            'recent_activity'   => \App\Models\AuditLog::with('user')
                ->latest('created_at')->limit(10)
                ->get(['action','created_at','user_id']),
            'exams_by_status'   => Exam::selectRaw('status, count(*) as count')->groupBy('status')->get(),
        ];
    }

    private function instructorStats(User $user): array
    {
        $examIds = $user->createdExams()->pluck('id');
        return [
            'total_exams'     => $examIds->count(),
            'total_questions' => \App\Models\Question::whereIn('exam_id', $examIds)->count(),
            'total_sessions'  => StudentExamSession::whereIn('exam_id', $examIds)->count(),
            'pass_rate'       => round(
                Result::whereIn('exam_id', $examIds)->where('passed', true)->count()
                / max(1, Result::whereIn('exam_id', $examIds)->count()) * 100, 1
            ),
            'pending_grading' => \App\Models\StudentAnswer::whereNull('is_correct')
                ->whereHas('session', fn($q) => $q->whereIn('exam_id', $examIds)
                    ->whereIn('status', ['submitted', 'graded', 'expired']))
                ->count(),
            'recent_exams'    => $user->createdExams()->latest()->limit(5)->get(['id','title','status','start_at']),
            'results_trend'   => Result::whereIn('exam_id', $examIds)
                ->selectRaw('DATE(created_at) as date, count(*) as count')
                ->groupBy('date')->orderBy('date')->limit(30)->get(),
        ];
    }

    private function studentStats(User $user): array
    {
        $accessible = $user->accessibleExams();
        return [
            'upcoming_exams'   => (clone $accessible)->published()
                ->where('start_at', '>', now())->count(),
            'ongoing_exams'    => (clone $accessible)->active()->count(),
            'completed_exams'  => $user->results()->count(),
            'pass_rate'        => round(
                $user->results()->where('passed', true)->count()
                / max(1, $user->results()->count()) * 100, 1
            ),
            'certificates'     => $user->certificates()->count(),
            'recent_results'   => $user->results()->with('exam:id,title')
                ->latest()->limit(5)->get(),
        ];
    }
}
