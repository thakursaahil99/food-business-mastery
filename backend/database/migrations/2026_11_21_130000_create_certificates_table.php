<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained()->nullOnDelete(); // null for self-paced courses
            $table->string('code', 16)->unique();     // public verification code, e.g. RB-7KQ2M9XA
            $table->string('student_name');           // as printed, kept even if the profile name changes later
            $table->string('course_title');
            $table->timestamp('issued_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'program_id']);
        });

        // The coach marks the final assessment as passed (cohort programs only).
        Schema::table('enrollments', function (Blueprint $table) {
            $table->timestamp('final_passed_at')->nullable()->after('enrolled_at');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', fn (Blueprint $table) => $table->dropColumn('final_passed_at'));
        Schema::dropIfExists('certificates');
    }
};
