<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'batch_id', 'title', 'description', 'type', 'coach_id', 'starts_at', 'ends_at', 'is_cancelled', 'module_title', 'week',
    'platform', 'recording_enabled', 'recording_status', 'recording_duration_sec', 'recording_path', 'join_url',
])]
class ClassSession extends Model
{
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_cancelled' => 'boolean',
            'recording_enabled' => 'boolean',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /** scheduled | live | completed | cancelled, worked out from the clock so no scheduler has to flip it. */
    public function status(): string
    {
        if ($this->is_cancelled) {
            return 'cancelled';
        }
        $now = now();

        return match (true) {
            $now->gte($this->ends_at) => 'completed',
            $now->gte($this->starts_at) => 'live',
            default => 'scheduled',
        };
    }
}
