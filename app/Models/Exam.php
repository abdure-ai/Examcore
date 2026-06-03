<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Exam extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'instructor_id', 'title', 'slug', 'description',
        'duration_minutes', 'passing_score', 'start_at', 'end_at',
        'max_attempts', 'status', 'settings', 'passcode',
    ];

    protected $hidden = ['passcode'];

    protected $appends = ['has_passcode'];

    protected $casts = [
        'settings'        => 'array',
        'start_at'        => 'datetime',
        'end_at'          => 'datetime',
        'passing_score'   => 'integer',
        'max_attempts'    => 'integer',
        'duration_minutes'=> 'integer',
        'instructor_id'   => 'integer',
    ];

    // ── Boot: auto-generate slug ──────────────────────────────────────────

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($exam) {
            $exam->slug = $exam->slug ?? Str::slug($exam->title) . '-' . Str::random(6);
        });
    }

    // ── Relationships ─────────────────────────────────────────────────────

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class)->orderBy('display_order');
    }

    public function sessions()
    {
        return $this->hasMany(StudentExamSession::class);
    }

    public function results()
    {
        return $this->hasMany(Result::class);
    }

    public function assignedStudents()
    {
        return $this->belongsToMany(User::class, 'exam_student');
    }

    public function assignedGroups()
    {
        return $this->belongsToMany(Group::class, 'exam_group');
    }

    // ── Helpers / Scopes ─────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->published()
            ->where('start_at', '<=', now())
            ->where('end_at', '>=', now());
    }

    public function getHasPasscodeAttribute(): bool
    {
        return !empty($this->attributes['passcode']);
    }

    public function isActive(): bool
    {
        return $this->status === 'published'
            && $this->start_at <= now()
            && $this->end_at >= now();
    }

    public function totalMarks(): int
    {
        return $this->questions()->sum('marks');
    }

    /** Fetch cached questions from Redis (TTL = exam duration) */
    public function cachedQuestions(): \Illuminate\Support\Collection
    {
        $key = "exam:{$this->id}:questions";
        $json = \Cache::remember($key, now()->addMinutes((int) $this->duration_minutes), function () {
            return $this->questions()->get()->toJson();
        });
        return collect(json_decode($json));
    }
}
