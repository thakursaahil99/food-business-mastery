<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable(['title', 'slug', 'tagline', 'description', 'duration_weeks', 'kind', 'coach_id', 'level', 'cover', 'is_published'])]
class Program extends Model
{
    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(ProgramModule::class)->orderBy('sort');
    }

    public function lessons(): HasManyThrough
    {
        return $this->hasManyThrough(Lesson::class, ProgramModule::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }
}
