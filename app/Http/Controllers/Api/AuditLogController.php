<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = AuditLog::with('user:id,name,email')
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->action, fn($q) => $q->where('action', 'like', "%{$request->action}%"))
            ->when($request->search, fn($q) => $q->whereHas('user', fn($uq) => $uq->where('name', 'like', "%{$request->search}%")));

        return response()->json($query->latest('id')->paginate(30));
    }
}
