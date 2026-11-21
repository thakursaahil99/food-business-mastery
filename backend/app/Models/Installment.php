<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['enrollment_id', 'label', 'due_date', 'amount', 'paid_at', 'invoice_no'])]
class Installment extends Model
{
    protected function casts(): array
    {
        return ['due_date' => 'date', 'paid_at' => 'datetime'];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /** paid | overdue | due (within a week) | upcoming. Derived, so it never goes stale. */
    public function status(): string
    {
        if ($this->paid_at) {
            return 'paid';
        }
        $today = now()->startOfDay();
        if ($this->due_date->lt($today)) {
            return 'overdue';
        }

        return $this->due_date->lte($today->copy()->addDays(7)) ? 'due' : 'upcoming';
    }
}
