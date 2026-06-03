<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'result_id', 'certificate_number', 'pdf_path', 'issued_at'];

    protected $casts = [
        'issued_at' => 'datetime',
        'user_id'   => 'integer',
        'result_id' => 'integer',
    ];

    public function user()   { return $this->belongsTo(User::class); }
    public function result() { return $this->belongsTo(Result::class); }

    public function downloadUrl(): string
    {
        return route('api.certificates.download', $this->id);
    }
}
