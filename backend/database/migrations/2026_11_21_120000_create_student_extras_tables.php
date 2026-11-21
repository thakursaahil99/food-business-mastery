<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->date('due_date');
            $table->unsignedInteger('amount'); // whole rupees, before GST
            $table->timestamp('paid_at')->nullable();
            $table->string('invoice_no', 40)->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->nullable()->constrained()->cascadeOnDelete(); // null = everyone
            $table->string('title');
            $table->text('body');
            $table->boolean('pinned')->default(false);
            $table->timestamps();
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('module_title')->nullable();
            $table->timestamp('due_at');
            $table->unsignedSmallInteger('max_score')->default(10);
            $table->timestamps();
        });

        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('text');
            $table->string('file_name')->nullable();
            $table->unsignedSmallInteger('score')->nullable();
            $table->text('feedback')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at');
            $table->timestamps();
            $table->unique(['assignment_id', 'user_id']);
        });

        Schema::create('doubts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category', 30);
            $table->string('subject');
            $table->text('body');
            $table->string('session_title')->nullable();
            $table->text('answer_body')->nullable();
            $table->foreignId('answered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('billing_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->string('gstin', 15);
            $table->string('address', 300);
            $table->string('state', 60);
            $table->timestamps();
        });

        Schema::create('reminder_prefs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('whatsapp')->default(true);
            $table->boolean('email')->default(true);
            $table->boolean('day_before')->default(true);
            $table->boolean('min15')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['reminder_prefs', 'billing_profiles', 'doubts', 'assignment_submissions', 'assignments', 'announcements', 'installments'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
