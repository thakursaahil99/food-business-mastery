<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['assignment_id', 'user_id', 'text', 'file_name', 'score', 'feedback', 'reviewed_by', 'submitted_at'])]
class AssignmentSubmission extends Model
{
    protected function casts(): array
    {
        return ['submitted_at' => 'datetime'];
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** Shape of web Submission. */
    public function toStudentArray(): array
    {
        return [
            'submittedAt' => $this->submitted_at->toIso8601String(),
            'text' => $this->text,
            'fileName' => $this->file_name,
            'score' => $this->score,
            'feedback' => $this->feedback,
            'reviewedBy' => $this->reviewer?->name,
        ];
    }
}
