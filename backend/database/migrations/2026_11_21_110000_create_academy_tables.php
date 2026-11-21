<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration_weeks');
            $table->string('kind', 10)->default('program');   // program (cohort, needs a batch) | short (self-paced, open to every student)
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('level', 20)->default('Beginner'); // Beginner | Intermediate | Advanced
            $table->string('cover')->nullable();              // relative path such as /photos/community-group.webp
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        Schema::create('program_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('summary')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->unsignedSmallInteger('week_from')->default(1);
            $table->unsignedSmallInteger('week_to')->default(1);
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_module_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type', 10)->default('video'); // video | pdf | live
            $table->unsignedInteger('duration_sec')->default(0);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_preview')->default(false);
            $table->unsignedSmallInteger('week')->nullable();   // unlocks when the batch reaches this week
            $table->timestamp('release_at')->nullable();        // or on this date, which wins over week
            $table->string('video_path')->nullable();           // relative path on Storage::disk('videos'), never a URL
            $table->timestamps();
        });

        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedSmallInteger('seats')->default(40);
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('price')->default(0); // whole rupees, before GST
            $table->string('status', 20)->default('upcoming'); // upcoming | running | completed
            $table->timestamps();
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('pending'); // pending | active | completed | cancelled
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamps();
            $table->unique(['user_id', 'batch_id']);
        });

        Schema::create('class_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type', 12)->default('live'); // live | webinar | mentorship
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('starts_at')->index();
            $table->timestamp('ends_at');
            $table->boolean('is_cancelled')->default(false);
            $table->string('module_title')->nullable();
            $table->unsignedSmallInteger('week')->nullable();
            $table->string('platform', 10)->default('zoom'); // zoom | livekit
            $table->boolean('recording_enabled')->default(true);
            $table->string('recording_status', 12)->default('off'); // off | scheduled | recording | processing | ready | failed
            $table->unsignedInteger('recording_duration_sec')->nullable();
            $table->string('recording_path')->nullable();
            $table->string('join_url', 500)->nullable(); // Zoom registrant or meeting link, set when the meeting is created
            $table->timestamps();
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->unsignedInteger('duration_sec')->default(0);
            $table->timestamps();
            $table->unique(['class_session_id', 'user_id']);
        });

        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('watched_sec')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        foreach (['lesson_progress', 'attendances', 'class_sessions', 'enrollments', 'batches', 'lessons', 'program_modules', 'programs'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
