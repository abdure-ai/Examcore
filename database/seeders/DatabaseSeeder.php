<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Exam;
use App\Models\Question;
use App\Models\Group;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Roles
        $adminRole = Role::firstOrCreate(['name' => 'super_admin']);
        $instructorRole = Role::firstOrCreate(['name' => 'instructor']);
        $studentRole = Role::firstOrCreate(['name' => 'student']);

        // 2. Create Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@exam.test'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $admin->syncRoles([$adminRole]);

        $instructor = User::firstOrCreate(
            ['email' => 'instructor@exam.test'],
            [
                'name' => 'Jane Instructor',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $instructor->syncRoles([$instructorRole]);

        $student = User::firstOrCreate(
            ['email' => 'student@exam.test'],
            [
                'name' => 'Alex Student',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $student->syncRoles([$studentRole]);

        // 3. Create Sample Setting Records
        Setting::updateOrCreate(['key' => 'system_name'], ['value' => 'ExamCore Pro', 'group' => 'general', 'label' => 'System Title']);
        Setting::updateOrCreate(['key' => 'registration_enabled'], ['value' => 'true', 'group' => 'general', 'label' => 'Allow Registration']);
        Setting::updateOrCreate(['key' => 'session_limit'], ['value' => '3', 'group' => 'exam', 'label' => 'Global Attempt Limit']);

        // 4. Create Sample Cohort (Group)
        $group = Group::firstOrCreate(
            ['name' => 'Computer Science Class A', 'instructor_id' => $instructor->id],
            ['description' => 'First year Computer Science majors.']
        );
        $group->students()->sync([$student->id]);

        // 5. Create Sample Exam
        $exam = Exam::firstOrCreate(
            ['slug' => 'introduction-to-laravel'],
            [
                'instructor_id' => $instructor->id,
                'title' => 'Introduction to Laravel 11 Framework',
                'description' => 'A basic test evaluating knowledge of Laravel routing, controllers, migrations, and Eloquent ORM.',
                'duration_minutes' => 15,
                'passing_score' => 60,
                'start_at' => now()->subDay(),
                'end_at' => now()->addDays(5),
                'max_attempts' => 2,
                'status' => 'published',
                'settings' => [
                    'randomize_questions' => true,
                    'randomize_options' => true,
                    'allow_review' => true,
                ]
            ]
        );

        // Assign exam to student and group
        $exam->assignedStudents()->sync([$student->id]);
        $exam->assignedGroups()->sync([$group->id]);

        // 6. Create Questions
        // MCQ 1
        Question::firstOrCreate(
            ['exam_id' => $exam->id, 'content' => 'Which file defines the route mappings in Laravel 11 by default?'],
            [
                'type' => 'MCQ',
                'category' => 'Routing',
                'options' => ['routes/web.php', 'app/routes.php', 'config/routes.php', 'routes.php'],
                'correct_answer' => '0', // option A
                'difficulty' => 'easy',
                'marks' => 20,
                'display_order' => 1,
                'explanation' => 'In Laravel 11, web routes are defined in the routes/web.php file.'
            ]
        );

        // MCQ 2
        Question::firstOrCreate(
            ['exam_id' => $exam->id, 'content' => 'What command is used to run newly created migrations?'],
            [
                'type' => 'MCQ',
                'category' => 'Migrations',
                'options' => ['php artisan migrate:rollback', 'php artisan migrate', 'php artisan run:migrations', 'php artisan db:seed'],
                'correct_answer' => '1', // option B
                'difficulty' => 'easy',
                'marks' => 20,
                'display_order' => 2,
                'explanation' => 'The php artisan migrate command executes all outstanding migrations.'
            ]
        );

        // TF 1
        Question::firstOrCreate(
            ['exam_id' => $exam->id, 'content' => 'Eloquent ORM utilizes the active record pattern design.'],
            [
                'type' => 'TF',
                'category' => 'Eloquent',
                'correct_answer' => 'true',
                'difficulty' => 'medium',
                'marks' => 20,
                'display_order' => 3,
                'explanation' => 'Yes, Eloquent models represent records in tables, which is the active record design pattern.'
            ]
        );

        // TF 2
        Question::firstOrCreate(
            ['exam_id' => $exam->id, 'content' => 'Laravel 11 requires PHP 7.4 or lower.'],
            [
                'type' => 'TF',
                'category' => 'Requirements',
                'correct_answer' => 'false',
                'difficulty' => 'easy',
                'marks' => 20,
                'display_order' => 4,
                'explanation' => 'Laravel 11 requires a minimum of PHP 8.2.'
            ]
        );

        // SA 1
        Question::firstOrCreate(
            ['exam_id' => $exam->id, 'content' => 'Explain the main difference between Eloquent eager loading and lazy loading.'],
            [
                'type' => 'SA',
                'category' => 'Eloquent',
                'correct_answer' => null, // short answer (requires manual review)
                'difficulty' => 'hard',
                'marks' => 20,
                'display_order' => 5,
                'explanation' => 'Eager loading loads related models alongside parent models using JOIN queries to prevent N+1 issues. Lazy loading loads relationships only when accessed.'
            ]
        );
    }
}
