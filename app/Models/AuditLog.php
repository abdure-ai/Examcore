<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;
    protected $fillable = ['user_id', 'action', 'model_type', 'model_id', 'payload', 'ip_address', 'user_agent'];
    protected $casts = ['payload' => 'array', 'created_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }

    public static function record(string $action, $model = null, array $payload = []): void
    {
        static::create([
            'user_id'    => auth()->id(),
            'action'     => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id'   => $model?->id,
            'payload'    => $payload,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
