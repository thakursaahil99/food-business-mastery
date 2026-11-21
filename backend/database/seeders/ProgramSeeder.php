<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

/** The flagship CGR / Food Contract Mastery Program and its 4-month curriculum. Safe to run again. */
class ProgramSeeder extends Seeder
{
    /** Self-paced courses open to every student. Each video lesson plays the 45 second demo clip. */
    private function seedShortCourses(): void
    {
        $courses = [
            ['kitchen-costing', 'Kitchen Costing Masterclass', 'Price every plate and protect your margin on cost-plus contracts.', '/photos/sector-industries.webp', 'Beginner',
                ['Costing basics' => ['Welcome to the masterclass', 'Recipe cost cards', 'Yield and wastage'], 'Daily control' => ['The consumption sheet', 'Variance and what to do about it']]],
            ['haccp-essentials', 'HACCP & Food Safety Essentials', 'Set up a HACCP plan and the daily logs auditors ask for.', '/photos/sector-corporate.webp', 'Intermediate',
                ['HACCP in practice' => ['Course introduction', 'The 7 HACCP principles', 'Critical control points in a hospital kitchen', 'Daily logs and record keeping']]],
            ['first-hospital-contract', 'Winning Your First Hospital Contract', 'From tender reading to a signed cost-plus agreement.', '/photos/sector-hospitals.webp', 'Advanced',
                ['The contract playbook' => ['Before you bid', 'Reading the tender', 'Building the proposal', 'Negotiation and closing']]],
        ];

        foreach ($courses as [$slug, $title, $tagline, $cover, $level, $modules]) {
            $course = Program::firstOrCreate(['slug' => $slug], [
                'title' => $title, 'tagline' => $tagline, 'description' => $tagline, 'kind' => 'short', 'duration_weeks' => 4,
                'level' => $level, 'cover' => $cover, 'is_published' => true,
            ]);
            if ($course->modules()->exists()) {
                continue;
            }
            $m = 0;
            foreach ($modules as $moduleTitle => $lessons) {
                $module = $course->modules()->create(['title' => $moduleTitle, 'summary' => '', 'sort' => ++$m, 'week_from' => 1, 'week_to' => 4]);
                foreach ($lessons as $j => $lessonTitle) {
                    $module->lessons()->create([
                        'title' => $lessonTitle, 'type' => 'video', 'duration_sec' => 45, 'video_path' => 'demo-lesson.mp4',
                        'sort' => $j + 1, 'is_preview' => $m === 1 && $j === 0, 'week' => null,
                    ]);
                }
            }
        }
    }

    public function run(): void
    {
        $program = Program::updateOrCreate(
            ['slug' => 'cgr-mastery'],
            [
                'title' => 'CGR Mastery Program',
                'tagline' => 'A 4-month practical workshop on winning and running food contracts, by Bobby Singh.',
                'description' => 'Healthcare F&B consultancy curriculum: infrastructure, compliance, operations, patient care integration and business development, with weekly live classes and direct mentorship.',
                'duration_weeks' => 16,
                'level' => 'Advanced',
                'cover' => '/photos/community-group.webp',
                'is_published' => true,
            ],
        );

        $this->seedShortCourses();

        if ($program->modules()->exists()) {
            return; // already seeded; admin edits must not be overwritten
        }

        // [title, topics, weekFrom, weekTo, lessons]
        $modules = [
            ['Healthcare Infrastructure', 'Kitchen layout & zoning · Equipment planning · Budgeting · Workflow design', 1, 4,
                ['Designing a hospital kitchen that flows', 'Equipment: buy, lease or client-supplied', 'Building the site budget', 'Workflow mapping for 3 meal services']],
            ['Compliance & Standards', 'NABH requirements · HACCP · Food safety systems · Regulatory compliance', 5, 8,
                ['NABH for F&B: what auditors check', 'HACCP plan, step by step', 'Food safety SOPs & logs', 'Licences, FSSAI and renewals']],
            ['Operations Management', 'Staff & rostering · Inventory & supply chain · Cost control · Performance monitoring', 9, 12,
                ['Rostering for 24x7 sites', 'Inventory & vendor management', 'Food-cost control dashboard', 'KPIs and monthly client reviews']],
            ['Patient Care Integration', 'Clinical nutrition · Therapeutic diets · Patient meal service · Quality assurance', 13, 16,
                ['Clinical nutrition basics', 'Therapeutic diet planning', 'Patient tray service', 'Quality assurance & feedback loops']],
            ['Business Development', 'Contract negotiation · Client acquisition · Proposals & tenders · Scaling to new sites', 1, 16,
                ['Reading a tender like a pro', 'Proposals that get signed', 'Negotiating cost-plus terms', 'From one site to five']],
            ['Certification & Practice', 'Live project · Case studies · Certification assessment · 1:1 mentorship', 16, 16,
                ['Live project brief', 'Case study: 400-bed hospital', 'Assessment prep', 'Final mentorship']],
        ];

        foreach ($modules as $i => [$title, $summary, $from, $to, $lessons]) {
            $module = $program->modules()->create([
                'title' => $title,
                'summary' => $summary,
                'sort' => $i + 1,
                'week_from' => $from,
                'week_to' => $to,
            ]);

            foreach ($lessons as $j => $lessonTitle) {
                $module->lessons()->create([
                    'title' => $lessonTitle,
                    'type' => $i === 1 && $j === 3 ? 'pdf' : 'video',
                    // Demo content: every video lesson plays the same 45 second sample, so the whole
                    // watch, no-skip and mark-as-done flow can be tried in under a minute.
                    'duration_sec' => ($i === 1 && $j === 3) ? 0 : 45,
                    'video_path' => ($i === 1 && $j === 3) ? null : 'demo-lesson.mp4',
                    'sort' => $j + 1,
                    'is_preview' => $i === 0 && $j === 0,
                    // Weekly modules unlock week by week; business development spreads over the program.
                    'week' => $i < 4 ? $from + $j : ($i === 4 ? 2 + $j * 4 : 16),
                ]);
            }
        }
    }
}
