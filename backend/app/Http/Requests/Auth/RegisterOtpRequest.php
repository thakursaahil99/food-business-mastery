<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['identifier' => ['required', 'string', 'max:120'], 'name' => ['required', 'string', 'min:2', 'max:80'], 'email' => ['required', 'email:rfc', 'max:120']];
    }
}
