<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sessions = App\Models\StudentExamSession::whereIn('status', ['graded','submitted','expired'])
    ->get();

foreach ($sessions as $session) {
    echo "Re-grading session {$session->id} ({$session->exam->title})...\n";
    App\Jobs\GradeExamJob::dispatchSync($session);
    $result = $session->fresh()->result;
    if ($result) {
        echo "  Score: {$result->percentage}% | Passed: ".($result->passed ? 'YES' : 'NO')."\n";
    } else {
        echo "  No result created.\n";
    }
}
echo "Done.\n";
