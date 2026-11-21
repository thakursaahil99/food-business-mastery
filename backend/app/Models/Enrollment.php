<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'batch_id', 'status', 'enrolled_at', 'final_passed_at'])]
class Enrollment extends Model
{
    protected function casts(): array
    {
        return ['enrolled_at' => 'datetime', 'final_passed_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class);
    }
}
