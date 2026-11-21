<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['program_module_id', 'title', 'type', 'duration_sec', 'sort', 'is_preview', 'week', 'release_at', 'video_path'])]
class Lesson extends Model
{
    protected function casts(): array
    {
        return ['is_preview' => 'boolean', 'release_at' => 'datetime'];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(ProgramModule::class, 'program_module_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }
}
