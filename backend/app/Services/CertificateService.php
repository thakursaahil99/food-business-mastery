<?php

namespace App\Services;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Attendance;
use App\Models\Certificate;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\Program;
use App\Models\User;

/**
 * Who has earned which certificate. The rules match the web portal's checklist:
 *  cohort program: attendance 75% or more, every lesson done, every homework sent, final test passed;
 *  self-paced course: every lesson done.
 * A certificate is issued the first time all steps are met, and never taken back automatically.
 */
class CertificateService
{
    public const MIN_ATTENDANCE = 75;

    /** @return array<int, array<string, mixed>> one entry per course the student is on */
    public function forUser(User $user): array
    {
        $out = [];

        $enrollments = Enrollment::where('user_id', $user->id)->whereIn('status', ['active', 'completed'])->with('batch.program')->get();
        foreach ($enrollments as $e) {
            $out[] = $this->entry($user, $e->batch->program, $this->programSteps($user, $e), $e->batch_id, $e->batch->name);
        }

        // Self-paced courses show up once the student has started them.
        $started = LessonProgress::where('user_id', $user->id)->pluck('lesson_id');
        $shortCourses = Program::where('kind', 'short')->where('is_published', true)
            ->whereHas('lessons', fn ($q) => $q->whereIn('lessons.id', $started))->orderBy('id')->get();
        foreach ($shortCourses as $course) {
            $out[] = $this->entry($user, $course, [$this->lessonsStep($user, $course)], null, null);
        }

        return $out;
    }

    private function entry(User $user, Program $program, array $steps, ?int $batchId, ?string $batchName): array
    {
        $done = collect($steps)->every(fn ($s) => $s['done']);

        $certificate = Certificate::where('user_id', $user->id)->where('program_id', $program->id)->first();
        if (! $certificate && $done) {
            $certificate = Certificate::create([
                'user_id' => $user->id,
                'program_id' => $program->id,
                'batch_id' => $batchId,
                'student_name' => $user->name,
                'course_title' => $program->title,
            ]);
        }

        return [
            'course' => ['id' => $program->id, 'slug' => $program->slug, 'title' => $program->title, 'kind' => $program->kind, 'batchName' => $batchName],
            'status' => $certificate?->isValid() ? 'earned' : 'in_progress',
            'steps' => $steps,
            'stepsDone' => collect($steps)->where('done', true)->count(),
            'certificate' => $certificate?->isValid() ? [
                'code' => $certificate->code,
                'studentName' => $certificate->student_name,
                'courseTitle' => $certificate->course_title,
                'issuedAt' => $certificate->issued_at->toIso8601String(),
                'url' => $certificate->verifyUrl(),
            ] : null,
        ];
    }

    private function programSteps(User $user, Enrollment $e): array
    {
        $held = ClassSession::where('batch_id', $e->batch_id)->where('is_cancelled', false)->where('ends_at', '<', now())->pluck('id');
        $joined = $held->isEmpty() ? 0 : Attendance::where('user_id', $user->id)->whereIn('class_session_id', $held)->count();
        $pct = $held->isEmpty() ? 0 : (int) round($joined / $held->count() * 100);

        $assignments = Assignment::where('batch_id', $e->batch_id)->pluck('id');
        $sent = AssignmentSubmission::where('user_id', $user->id)->whereIn('assignment_id', $assignments)->count();

        return [
            ['key' => 'attendance', 'label' => 'Attend 75% or more of the classes', 'done' => $held->isNotEmpty() && $pct >= self::MIN_ATTENDANCE, 'current' => $pct, 'total' => 100, 'unit' => '%'],
            $this->lessonsStep($user, $e->batch->program),
            ['key' => 'homework', 'label' => 'Send all your homework', 'done' => $assignments->isNotEmpty() && $sent >= $assignments->count(), 'current' => $sent, 'total' => $assignments->count(), 'unit' => null],
            ['key' => 'final', 'label' => 'Pass the final test', 'done' => (bool) $e->final_passed_at, 'current' => $e->final_passed_at ? 1 : 0, 'total' => 1, 'unit' => null, 'hint' => $e->final_passed_at ? null : 'The final test is in the last week.'],
        ];
    }

    private function lessonsStep(User $user, Program $program): array
    {
        $ids = $program->lessons()->pluck('lessons.id');
        $done = $ids->isEmpty() ? 0 : LessonProgress::where('user_id', $user->id)->whereIn('lesson_id', $ids)->whereNotNull('completed_at')->count();

        return ['key' => 'lessons', 'label' => 'Finish every lesson', 'done' => $ids->isNotEmpty() && $done >= $ids->count(), 'current' => $done, 'total' => $ids->count(), 'unit' => null];
    }
}
