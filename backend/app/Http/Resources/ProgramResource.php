<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Program */
class ProgramResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'durationWeeks' => $this->duration_weeks,
            'level' => $this->level,
            'cover' => $this->cover,
            'modules' => $this->whenLoaded('modules', fn () => $this->modules->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'summary' => $m->summary,
                'order' => $m->sort,
                'weekFrom' => $m->week_from,
                'weekTo' => $m->week_to,
                'lessonCount' => $m->lessons->count(),
            ])),
        ];
    }
}
