<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class AdminLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['email' => ['required', 'email', 'max:120'], 'password' => ['required', 'string', 'max:200'], 'device_name' => ['nullable', 'string', 'max:60']];
    }
}
