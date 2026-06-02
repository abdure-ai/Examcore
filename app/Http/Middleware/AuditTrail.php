<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditTrail
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log write operations (POST, PUT, PATCH, DELETE) that were successful
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE']) && $response->isSuccessful()) {
            $user = $request->user();
            if ($user) {
                // Determine action based on URI
                $action = strtolower($request->method() . '.' . str_replace('/', '.', trim($request->getPathInfo(), '/')));
                
                // Redact passwords or tokens in payload
                $payload = $request->except(['password', 'password_confirmation', 'token', 'avatar']);

                AuditLog::create([
                    'user_id'    => $user->id,
                    'action'     => $action,
                    'payload'    => $payload,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);
            }
        }

        return $response;
    }
}
