<?php

namespace App\Http\Requests\Admission;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'nurse'], true);
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'ward' => ['required', 'string', 'max:100'],
            'bed_number' => ['required', 'string', 'max:50'],
            'admitted_at' => ['nullable', 'date'],
        ];
    }
}

