<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = ['instructor_id', 'name', 'description'];

    public function instructor() { return $this->belongsTo(User::class, 'instructor_id'); }
    public function students()   { return $this->belongsToMany(User::class); }
    public function exams()      { return $this->belongsToMany(Exam::class, 'exam_group'); }
}
