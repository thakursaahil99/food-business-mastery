<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['class_session_id', 'user_id', 'joined_at', 'left_at', 'duration_sec'])]
class Attendance extends Model
{
    protected function casts(): array
    {
        return ['joined_at' => 'datetime', 'left_at' => 'datetime'];
    }
}
