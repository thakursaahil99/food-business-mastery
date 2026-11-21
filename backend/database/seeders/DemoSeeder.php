<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Attendance;
use App\Models\Doubt;
use App\Models\Batch;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Program;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

/**
 * Local demo data: coaches, one running batch with classes around today, a demo student, and the
 * super admin enrolled so the student portal has something to show. Only runs in the local environment.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $program = Program::where('slug', 'cgr-mastery')->firstOrFail();

        $bobby = User::updateOrCreate(
            ['email' => 'bobby@redbean.test'],
            ['name' => 'Bobby Singh', 'title' => 'MD, Red Bean Hospitality', 'role' => Role::Admin, 'is_active' => true],
        );
        $anjali = User::updateOrCreate(
            ['email' => 'anjali@redbean.test'],
            ['name' => 'Coach Anjali', 'title' => 'Operations coach', 'role' => Role::Coach, 'is_active' => true],
        );
        // Short courses get their coach once the coaches exist.
        Program::where('kind', 'short')->whereIn('slug', ['kitchen-costing', 'first-hospital-contract'])->update(['coach_id' => $bobby->id]);
        Program::where('slug', 'haccp-essentials')->update(['coach_id' => $anjali->id]);

        $student = User::updateOrCreate(
            ['phone' => '+919999900001'],
            ['name' => 'Demo Student', 'email' => 'student@redbean.test', 'role' => Role::Student, 'is_active' => true, 'phone_verified_at' => now()],
        );

        $start = CarbonImmutable::now('Asia/Kolkata')->subDays(44)->startOfDay();
        $batch = Batch::updateOrCreate(
            ['program_id' => $program->id, 'name' => 'Batch 07 · Oct 2026'],
            ['start_date' => $start, 'end_date' => $start->addWeeks(16), 'seats' => 40, 'coach_id' => $bobby->id, 'price' => 150000, 'status' => 'running'],
        );

        $students = collect([$student, User::where('role', Role::SuperAdmin)->first()])->filter();
        foreach ($students as $s) {
            Enrollment::updateOrCreate(['user_id' => $s->id, 'batch_id' => $batch->id], ['status' => 'active', 'enrolled_at' => $start->subDays(9)]);
        }

        if ($batch->sessions()->exists()) {
            return;
        }

        $this->seedSessions($batch, $bobby, $anjali, $students);
        $this->seedProgress($program, $batch, $students);
        $this->seedExtras($batch, $bobby, $students);
    }

    /** Fee plan, announcements, assignments and a doubt, so every student page has something to show. */
    private function seedExtras(Batch $batch, User $bobby, $students): void
    {
        $start = CarbonImmutable::parse($batch->start_date);
        $plan = [
            ['Booking amount', -9, true, 'RBH/26-27/0412'],
            ['Instalment 1', 0, true, 'RBH/26-27/0458'],
            ['Instalment 2', 30, true, 'RBH/26-27/0533'],
            ['Instalment 3', 41, true, 'RBH/26-27/0601'],
            ['Instalment 4', null, false, null], // due in 4 days
            ['Instalment 5', null, false, null], // due in 34 days
        ];
        foreach ($students as $s) {
            $enrollment = Enrollment::where('user_id', $s->id)->where('batch_id', $batch->id)->first();
            foreach ($plan as $i => [$label, $offset, $paid, $invoice]) {
                $due = $offset === null ? now()->addDays($i === 4 ? 4 : 34) : $start->addDays($offset);
                $enrollment->installments()->create([
                    'label' => $label,
                    'due_date' => $due->toDateString(),
                    'amount' => 25000,
                    'paid_at' => $paid ? $due->subDay() : null,
                    // Invoice numbers are unique across the company, so make them per student.
                    'invoice_no' => $invoice ? $invoice.'-'.$s->id : null,
                ]);
            }
        }

        foreach ([
            ['NABH audit checklist uploaded', 'Download the 62-point checklist from Resources before Thursday\'s simulation.', true],
            ['Offline meet-up · Delhi', 'Batch 07 meet-up on the 14th. Register from the Events tab.', false],
        ] as [$title, $body, $pinned]) {
            Announcement::create(['batch_id' => null, 'title' => $title, 'body' => $body, 'pinned' => $pinned]);
        }

        Assignment::create([
            'batch_id' => $batch->id, 'title' => 'Draft a HACCP plan for a 200-bed hospital kitchen', 'module_title' => 'Compliance & Standards',
            'description' => 'List the hazards, critical control points and monitoring steps for one meal service.',
            'due_at' => now()->addDays(5), 'max_score' => 20,
        ]);
        $done = Assignment::create([
            'batch_id' => $batch->id, 'title' => 'Site budget worksheet', 'module_title' => 'Healthcare Infrastructure',
            'description' => 'Build a one-page budget for a new 150-bed site.', 'due_at' => now()->subDays(12), 'max_score' => 10,
        ]);
        foreach ($students as $s) {
            AssignmentSubmission::create([
                'assignment_id' => $done->id, 'user_id' => $s->id, 'text' => 'Budget attached: equipment 38%, manpower 41%, consumables 21%.',
                'score' => 8, 'feedback' => 'Good split. Add a contingency line next time.', 'reviewed_by' => $bobby->id, 'submitted_at' => now()->subDays(13),
            ]);
        }

        Doubt::create([
            'user_id' => $students->first()->id, 'category' => 'Live class', 'subject' => 'Which FSSAI licence for a hospital canteen?',
            'body' => 'Do we need a central or a state licence for a 120-bed hospital canteen?', 'session_title' => 'Licences, FSSAI and renewals',
            'answer_body' => 'State licence if turnover is under 20 crore. We will cover the exceptions in Thursday\'s class.', 'answered_by' => $bobby->id, 'answered_at' => now()->subDay(),
        ]);
    }

    private function seedSessions(Batch $batch, User $bobby, User $anjali, $students): void
    {
        $now = CarbonImmutable::now('Asia/Kolkata');
        // Times are Indian times; convert to UTC before saving (the app stores UTC).
        $at = fn (int $day, int $hour, int $min = 0) => $now->addDays($day)->setTime($hour, $min)->utc();

        // day offset, hour, minutes, title, type, coach, module, week, cancelled
        $seeds = [
            [-12, 19, 120, 'Workflow mapping for 3 meal services', 'live', $bobby, 'Healthcare Infrastructure', 4, false],
            [-10, 19, 120, 'NABH for F&B: what auditors check', 'live', $bobby, 'Compliance & Standards', 5, false],
            [-8, 11, 90, 'Webinar: Winning hospital tenders in 2027', 'webinar', $bobby, null, null, false],
            [-7, 19, 120, 'HACCP plan, step by step', 'live', $bobby, 'Compliance & Standards', 5, false],
            [-5, 19, 120, 'Food safety SOPs & logs', 'live', $bobby, 'Compliance & Standards', 6, false],
            [-3, 19, 120, 'Licences, FSSAI and renewals', 'live', $bobby, 'Compliance & Standards', 6, false],
            [-2, 17, 30, 'Mentorship: proposal review', 'mentorship', $bobby, null, null, false],
            [1, 19, 120, 'Discipline class: The owner\'s morning', 'live', $anjali, null, 7, false],
            [2, 19, 120, 'Audit simulation: NABH walkthrough', 'live', $bobby, 'Compliance & Standards', 7, false],
            [4, 11, 90, 'Webinar: Pricing cost-plus contracts', 'webinar', $bobby, null, null, false],
            [5, 19, 120, 'Rostering for 24x7 sites', 'live', $bobby, 'Operations Management', 8, false],
            [7, 16, 30, 'Mentorship: site expansion plan', 'mentorship', $bobby, null, null, false],
            [8, 19, 120, 'Inventory & vendor management', 'live', $bobby, 'Operations Management', 8, false],
            [9, 19, 120, 'Guest session: Hospital procurement', 'live', $anjali, null, null, true],
            [12, 19, 120, 'Food-cost control dashboard', 'live', $bobby, 'Operations Management', 9, false],
        ];

        foreach ($seeds as $i => [$day, $hour, $mins, $title, $type, $coach, $module, $week, $cancelled]) {
            $starts = $at($day, $hour);
            $ends = $starts->addMinutes($mins);
            $past = $ends->isPast();
            $recorded = $type !== 'mentorship' && ! $cancelled;

            $session = ClassSession::create([
                'batch_id' => $batch->id,
                'title' => $title,
                'type' => $type,
                'coach_id' => $coach->id,
                'starts_at' => $starts,
                'ends_at' => $ends,
                'is_cancelled' => $cancelled,
                'module_title' => $module,
                'week' => $week,
                'platform' => 'zoom',
                'recording_enabled' => $type !== 'mentorship',
                'recording_status' => ! $recorded ? 'off' : ($past ? 'ready' : 'scheduled'),
                'recording_duration_sec' => $recorded && $past ? $mins * 60 - 300 - ($i % 5) * 120 : null,
            ]);

            if ($past && ! $cancelled && $i % 5 !== 3) {
                foreach ($students as $s) {
                    Attendance::create([
                        'class_session_id' => $session->id,
                        'user_id' => $s->id,
                        'joined_at' => $starts->addMinutes(2),
                        'left_at' => $ends->subMinutes(5),
                        'duration_sec' => (int) round($mins * 60 * (0.82 + ($i % 4) * 0.05)),
                    ]);
                }
            }
        }

        // One class running right now and one about to open, to try the join flow.
        $live = now()->subMinutes(22);
        ClassSession::create([
            'batch_id' => $batch->id, 'title' => 'Live Q&A: Your compliance doubts', 'type' => 'live', 'coach_id' => $bobby->id,
            'description' => 'Bring your NABH and HACCP questions. Open floor with MD Sir.',
            'starts_at' => $live, 'ends_at' => $live->copy()->addMinutes(90), 'module_title' => 'Compliance & Standards', 'week' => 7,
            'platform' => 'zoom', 'recording_enabled' => true, 'recording_status' => 'recording',
        ]);
        $soon = now()->addMinutes(7);
        ClassSession::create([
            'batch_id' => $batch->id, 'title' => 'Hot seat: Cost-plus pricing clinic', 'type' => 'webinar', 'coach_id' => $bobby->id,
            'description' => 'Three students present a live contract. Everyone learns.',
            'starts_at' => $soon, 'ends_at' => $soon->copy()->addMinutes(60), 'module_title' => 'Business Development', 'week' => 7,
            'platform' => 'zoom', 'recording_enabled' => true, 'recording_status' => 'scheduled',
        ]);
    }

    private function seedProgress(Program $program, Batch $batch, $students): void
    {
        $week = $batch->currentWeek();

        // The first short course is finished, so the student already has one certificate to look at.
        $firstShort = Program::where('slug', 'kitchen-costing')->first();
        foreach ($firstShort?->lessons()->orderBy('lessons.id')->get() ?? [] as $lesson) {
            foreach ($students as $s) {
                LessonProgress::updateOrCreate(['user_id' => $s->id, 'lesson_id' => $lesson->id], ['watched_sec' => $lesson->duration_sec, 'completed_at' => now()->subDays(3)]);
            }
        }

        foreach ($program->lessons()->where('week', '<=', $week)->get() as $lesson) {
            /** @var Lesson $lesson */
            $done = $lesson->week < $week;
            foreach ($students as $s) {
                LessonProgress::updateOrCreate(
                    ['user_id' => $s->id, 'lesson_id' => $lesson->id],
                    [
                        'watched_sec' => $done ? $lesson->duration_sec : (int) round($lesson->duration_sec * 0.42),
                        'completed_at' => $done ? now()->subDays(max(1, ($week - $lesson->week) * 7 - 2)) : null,
                    ],
                );
            }
        }
    }
}
