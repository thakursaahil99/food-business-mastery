<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Assignment;
use App\Models\Attendance;
use App\Models\Batch;
use App\Models\Certificate;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\Program;
use App\Models\User;
use Database\Seeders\ProgramSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificateTest extends TestCase
{
    use RefreshDatabase;

    private Program $program;

    private Batch $batch;

    private User $student;

    private Enrollment $enrollment;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProgramSeeder::class);
        $this->program = Program::where('slug', 'cgr-mastery')->firstOrFail();
        $this->batch = Batch::create(['program_id' => $this->program->id, 'name' => 'Batch 01', 'start_date' => now()->subWeeks(17)->toDateString(), 'end_date' => now()->subWeek()->toDateString(), 'status' => 'completed']);
        $this->student = User::factory()->create(['name' => 'Meera Joshi']);
        $this->enrollment = Enrollment::create(['user_id' => $this->student->id, 'batch_id' => $this->batch->id, 'status' => 'active', 'enrolled_at' => now()->subWeeks(18)]);
    }

    private function finishLessons(Program $program, User $user): void
    {
        foreach ($program->lessons()->get() as $l) {
            LessonProgress::updateOrCreate(['user_id' => $user->id, 'lesson_id' => $l->id], ['watched_sec' => $l->duration_sec, 'completed_at' => now()]);
        }
    }

    /** Four classes held; attend `$attended` of them. */
    private function classes(int $attended): void
    {
        foreach (range(1, 4) as $i) {
            $s = ClassSession::create(['batch_id' => $this->batch->id, 'title' => "Class $i", 'type' => 'live', 'starts_at' => now()->subDays(10 + $i), 'ends_at' => now()->subDays(10 + $i)->addHours(2)]);
            if ($i <= $attended) {
                Attendance::create(['class_session_id' => $s->id, 'user_id' => $this->student->id, 'duration_sec' => 6000]);
            }
        }
    }

    private function program(): array
    {
        $all = $this->actingAs($this->student)->getJson('/api/v1/my/certificates')->assertOk()->json('data');

        return collect($all)->firstWhere('course.slug', 'cgr-mastery');
    }

    public function test_program_certificate_needs_all_four_steps(): void
    {
        $this->classes(3); // 75%
        $this->finishLessons($this->program, $this->student);
        $a = Assignment::create(['batch_id' => $this->batch->id, 'title' => 'HW', 'description' => 'd', 'due_at' => now()->subDay()]);
        $a->submissions()->create(['user_id' => $this->student->id, 'text' => 'my work here', 'submitted_at' => now()]);

        $p = $this->program();
        $this->assertSame('in_progress', $p['status']);
        $this->assertSame(3, $p['stepsDone']);
        $this->assertSame(['attendance' => true, 'lessons' => true, 'homework' => true, 'final' => false], collect($p['steps'])->pluck('done', 'key')->all());
        $this->assertDatabaseCount('certificates', 0);

        $this->enrollment->update(['final_passed_at' => now()]);
        $p = $this->program();
        $this->assertSame('earned', $p['status']);
        $this->assertSame('Meera Joshi', $p['certificate']['studentName']);
        $this->assertMatchesRegularExpression('/^RB-[2-9A-HJKMNP-Z]{8}$/', $p['certificate']['code']);
        $this->assertStringEndsWith('/certificates/'.$p['certificate']['code'], $p['certificate']['url']);

        // Asking again does not issue a second one.
        $this->program();
        $this->assertDatabaseCount('certificates', 1);
    }

    public function test_attendance_under_75_percent_blocks_the_certificate(): void
    {
        $this->classes(2); // 50%
        $this->finishLessons($this->program, $this->student);
        $this->enrollment->update(['final_passed_at' => now()]);

        $p = $this->program();
        $this->assertSame('in_progress', $p['status']);
        $this->assertSame(50, collect($p['steps'])->firstWhere('key', 'attendance')['current']);
    }

    public function test_short_course_certificate_after_every_lesson(): void
    {
        $course = Program::where('slug', 'kitchen-costing')->firstOrFail();
        $first = $course->lessons()->orderBy('lessons.id')->first();
        LessonProgress::create(['user_id' => $this->student->id, 'lesson_id' => $first->id, 'watched_sec' => 45, 'completed_at' => now()]);

        $short = fn () => collect($this->actingAs($this->student)->getJson('/api/v1/my/certificates')->json('data'))->firstWhere('course.slug', 'kitchen-costing');
        $this->assertSame('in_progress', $short()['status']);
        $this->assertSame(1, $short()['steps'][0]['current']);

        $this->finishLessons($course, $this->student);
        $this->assertSame('earned', $short()['status']);
    }

    public function test_untouched_short_courses_are_not_listed(): void
    {
        $slugs = collect($this->actingAs($this->student)->getJson('/api/v1/my/certificates')->json('data'))->pluck('course.slug');
        $this->assertSame(['cgr-mastery'], $slugs->all());
    }

    public function test_public_verify_and_page(): void
    {
        $c = Certificate::create(['user_id' => $this->student->id, 'program_id' => $this->program->id, 'batch_id' => $this->batch->id, 'student_name' => 'Meera Joshi', 'course_title' => 'CGR Mastery Program']);

        $this->getJson('/api/v1/certificates/'.strtolower($c->code))->assertOk()
            ->assertJsonPath('data.valid', true)->assertJsonPath('data.studentName', 'Meera Joshi')->assertJsonPath('data.batchName', 'Batch 01')
            ->assertJsonMissingPath('data.email')->assertJsonMissingPath('data.phone');
        $this->getJson('/api/v1/certificates/RB-NOTREAL1')->assertNotFound()->assertJsonPath('data.valid', false);

        $this->get("/certificates/{$c->code}")->assertOk()->assertSee('Meera Joshi')->assertSee('This certificate is real')->assertSee('<svg', false);
        $this->get('/certificates/RB-NOTREAL1')->assertNotFound()->assertSee('No certificate found');

        $c->update(['revoked_at' => now()]);
        $this->get("/certificates/{$c->code}")->assertOk()->assertSee('withdrawn');
        $this->getJson("/api/v1/certificates/{$c->code}")->assertJsonPath('data.valid', false);
    }

    public function test_only_team_can_mark_the_final_test(): void
    {
        $this->actingAs($this->student)->postJson("/api/v1/admin/enrollments/{$this->enrollment->id}/final-passed", ['passed' => true])->assertForbidden();
        $this->actingAs(User::factory()->team(Role::Coach)->create())->postJson("/api/v1/admin/enrollments/{$this->enrollment->id}/final-passed", ['passed' => true])
            ->assertOk()->assertJsonPath('data.finalPassed', true);
        $this->assertNotNull($this->enrollment->fresh()->final_passed_at);
    }

    public function test_my_certificates_needs_a_token(): void
    {
        $this->getJson('/api/v1/my/certificates')->assertUnauthorized();
    }
}
