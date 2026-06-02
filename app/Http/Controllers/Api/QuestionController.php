<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Question;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class QuestionController extends Controller
{
    public function index(Exam $exam)
    {
        $this->authorize('view', $exam);
        return response()->json($exam->questions()->get());
    }

    public function store(Request $request, Exam $exam)
    {
        $this->authorize('update', $exam);
        $data = $request->validate([
            'type'            => 'required|in:MCQ,TF,SA',
            'category'        => 'nullable|string|max:100',
            'content'         => 'required|string',
            'options'         => 'required_if:type,MCQ|nullable|array',
            'options.*'       => 'string',
            'correct_answer'  => 'required_unless:type,SA|nullable|string',
            'difficulty'      => 'required|in:easy,medium,hard',
            'marks'           => 'required|integer|min:1|max:100',
            'display_order'   => 'sometimes|integer|min:0',
            'explanation'     => 'nullable|string',
        ]);

        $question = $exam->questions()->create($data);
        Cache::forget("exam:{$exam->id}:questions");
        AuditLog::record('question.created', $question, ['exam_id' => $exam->id]);

        return response()->json($question, 201);
    }

    public function show(Exam $exam, Question $question)
    {
        $this->authorize('view', $exam);
        return response()->json($question);
    }

    public function update(Request $request, Exam $exam, Question $question)
    {
        $this->authorize('update', $exam);
        $data = $request->validate([
            'type'            => 'sometimes|in:MCQ,TF,SA',
            'category'        => 'nullable|string|max:100',
            'content'         => 'sometimes|string',
            'options'         => 'required_if:type,MCQ|nullable|array',
            'options.*'       => 'string',
            'correct_answer'  => 'required_unless:type,SA|nullable|string',
            'difficulty'      => 'sometimes|in:easy,medium,hard',
            'marks'           => 'sometimes|integer|min:1|max:100',
            'display_order'   => 'sometimes|integer|min:0',
            'explanation'     => 'nullable|string',
        ]);

        $question->update($data);
        Cache::forget("exam:{$exam->id}:questions");
        AuditLog::record('question.updated', $question, ['exam_id' => $exam->id]);

        return response()->json($question);
    }

    public function destroy(Exam $exam, Question $question)
    {
        $this->authorize('update', $exam);
        $question->delete();
        Cache::forget("exam:{$exam->id}:questions");
        AuditLog::record('question.deleted', $question, ['exam_id' => $exam->id]);

        return response()->json(['message' => 'Question deleted successfully.']);
    }

    public function downloadTemplate(Exam $exam)
    {
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="questions_template.csv"',
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $rows = [
            ['type', 'category', 'content', 'options', 'correct_answer', 'difficulty', 'marks'],
            ['MCQ', 'Math', 'What is 2 + 2?', 'Three|Four|Five|Six', 'Four', 'easy', '1'],
            ['TF', 'Science', 'The Earth is flat.', '', 'false', 'easy', '1'],
            ['SA', 'History', 'Who invented the telephone?', '', '', 'medium', '2'],
        ];

        $callback = function () use ($rows) {
            $handle = fopen('php://output', 'w');
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function bulkImport(Request $request, Exam $exam)
    {
        $this->authorize('update', $exam);
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx',
        ]);

        $file    = $request->file('file');
        $content = file_get_contents($file->getRealPath());

        // Strip UTF-8 BOM that Excel adds
        $content = ltrim($content, "\xEF\xBB\xBF");

        // Convert to UTF-8 if the file is Windows-1252 / Latin-1 encoded
        if (!mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
        }

        // Normalise line endings, then parse CSV
        $content = str_replace(["\r\n", "\r"], "\n", $content);
        $lines   = array_filter(explode("\n", $content), fn($l) => trim($l) !== '');
        $data    = array_map('str_getcsv', array_values($lines));
        $header  = array_shift($data);

        $imported = 0;
        foreach ($data as $row) {
            // Trim whitespace and ensure every cell is valid UTF-8
            $row = array_map(fn($v) => mb_convert_encoding(trim((string) $v), 'UTF-8', 'UTF-8'), $row);
            if (count($row) < 5) continue;
            // Format: type, category, content, options, correct_answer, difficulty, marks
            $type          = $row[0];
            $category      = $row[1] ?: 'General';
            $content       = $row[2];
            $optionsRaw    = $row[3] ?? null;
            $correctAnswer = $row[4] ?? null;
            $difficulty    = $row[5] ?: 'medium';
            $marks         = intval($row[6] ?? 1);

            $options = null;
            if ($type === 'MCQ' && $optionsRaw) {
                // assume comma separated or pipe separated
                $options = str_contains($optionsRaw, '|') ? explode('|', $optionsRaw) : explode(',', $optionsRaw);
                $options = array_map('trim', $options);
            }

            $exam->questions()->create([
                'type' => $type,
                'category' => $category,
                'content' => $content,
                'options' => $options,
                'correct_answer' => $correctAnswer,
                'difficulty' => $difficulty,
                'marks' => $marks,
            ]);
            $imported++;
        }

        Cache::forget("exam:{$exam->id}:questions");
        AuditLog::record('questions.bulk_imported', $exam, ['count' => $imported]);

        return response()->json(['message' => "Successfully imported {$imported} questions."]);
    }
}
