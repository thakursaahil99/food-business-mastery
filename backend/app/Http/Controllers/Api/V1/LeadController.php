<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Models\Lead;
use App\Services\Otp\Identifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class LeadController extends Controller
{
    /** POST /leads: public "Apply for CGR Workshop" form. */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        $phone = Identifier::parse($request->validated('phone'));
        if (! $phone?->isPhone()) {
            throw ValidationException::withMessages(['phone' => 'Enter a valid 10-digit mobile number.']);
        }

        $lead = Lead::create([
            'name' => $request->validated('name'),
            'email' => mb_strtolower($request->validated('email')),
            'phone' => $phone->value,
            'business_goals' => $request->validated('business_goals'),
            'source' => $request->validated('source') ?? 'website',
        ]);

        return response()->json(['data' => ['id' => $lead->id]], 201);
    }
}
