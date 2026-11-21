<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['program_id', 'name', 'start_date', 'end_date', 'seats', 'coach_id', 'price', 'status'])]
class Batch extends Model
{
    protected function casts(): array
    {
        return ['start_date' => 'date', 'end_date' => 'date'];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }

    /** Week of the program the batch is in today (1-based, clamped to the program length). */
    public function currentWeek(): int
    {
        $week = (int) floor($this->start_date->startOfDay()->diffInDays(now(), false) / 7) + 1;

        return max(1, min($this->program->duration_weeks, $week));
    }
}
