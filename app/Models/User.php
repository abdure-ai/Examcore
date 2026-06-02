<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = ['name', 'username', 'email', 'password', 'avatar', 'is_active'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────────────────

    public function createdExams()
    {
        return $this->hasMany(Exam::class, 'instructor_id');
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class);
    }

    public function assignedExams()
    {
        return $this->belongsToMany(Exam::class, 'exam_student');
    }

    public function examSessions()
    {
        return $this->hasMany(StudentExamSession::class);
    }

    public function results()
    {
        return $this->hasMany(Result::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isInstructor(): bool
    {
        return $this->hasRole('instructor');
    }

    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    public function avatarUrl(): string
    {
        return $this->avatar
            ? asset('storage/' . $this->avatar)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=6366f1&color=fff';
    }

    /** All exams accessible to this student (direct + via groups) */
    public function accessibleExams()
    {
        $directIds    = $this->assignedExams()->pluck('exams.id');
        $groupIds     = $this->groups()->pluck('groups.id');
        $groupExamIds = \DB::table('exam_group')
            ->whereIn('group_id', $groupIds)
            ->pluck('exam_id');

        return Exam::whereIn('id', $directIds->merge($groupExamIds)->unique());
    }
}
