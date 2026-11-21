<?php

namespace App\Http\Requests\Lead;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'min:2', 'max:80'], 'email' => ['required', 'email:rfc', 'max:120'], 'phone' => ['required', 'string', 'max:20'], 'business_goals' => ['nullable', 'string', 'max:2000'], 'source' => ['nullable', 'string', 'max:40']];
    }
}
