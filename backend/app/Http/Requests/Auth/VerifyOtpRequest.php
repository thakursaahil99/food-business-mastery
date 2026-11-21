<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['identifier' => ['required', 'string', 'max:120'], 'code' => ['required', 'digits:6'], 'device_name' => ['nullable', 'string', 'max:60']];
    }
}
