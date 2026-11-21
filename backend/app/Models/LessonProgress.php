<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'lesson_id', 'watched_sec', 'completed_at'])]
class LessonProgress extends Model
{
    protected $table = 'lesson_progress';

    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }
}
