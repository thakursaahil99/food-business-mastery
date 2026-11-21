<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shape of web/src/lib/types.ts ClassSession. Expects batch.program, coach and the current
 * user's attendances (filtered by user_id) to be eager loaded.
 *
 * @mixin \App\Models\ClassSession
 */
class ClassSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $status = $this->status();
        $attendance = $this->attendances->first();
        $over = $status === 'completed';

        return [
            'id' => $this->id,
            'batchId' => $this->batch_id,
            'batchName' => $this->batch->name,
            'programTitle' => $this->batch->program->title,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'coach' => $this->coach ? new CoachResource($this->coach) : null,
            'startsAt' => $this->starts_at->toIso8601String(),
            'endsAt' => $this->ends_at->toIso8601String(),
            'status' => $status,
            'moduleTitle' => $this->module_title,
            'week' => $this->week,
            'platform' => $this->platform,
            'recordingEnabled' => $this->recording_enabled,
            'recordingStatus' => $this->recording_status,
            'recordingDurationSec' => $this->recording_duration_sec,
            'recordingAvailable' => $this->recording_status === 'ready',
            // Only meaningful once the class is over; Zoom participant webhooks fill attendances.
            'attended' => $over ? $attendance !== null : null,
            'attendedSec' => $over && $attendance ? $attendance->duration_sec : null,
        ];
    }
}
