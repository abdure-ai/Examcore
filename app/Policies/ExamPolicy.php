<?php

namespace App\Policies;

use App\Models\Exam;
use App\Models\User;

class ExamPolicy
{
    public function view(User $user, Exam $exam): bool
    {
        if ($user->hasRole('super_admin')) return true;
        if ($user->hasRole('instructor')) return (int) $exam->instructor_id === (int) $user->id;
        // student: allowed if directly assigned or in an assigned group
        if ($user->hasRole('student')) {
            return $exam->assignedStudents()->where('users.id', $user->id)->exists()
                || $exam->assignedGroups()->whereHas('students', fn ($q) => $q->where('users.id', $user->id))->exists();
        }
        return false;
    }

    public function update(User $user, Exam $exam): bool
    {
        if ($user->hasRole('super_admin')) return true;
        return $user->hasRole('instructor') && (int) $exam->instructor_id === (int) $user->id;
    }

    public function delete(User $user, Exam $exam): bool
    {
        return $this->update($user, $exam);
    }
}
