<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'nurse';
    }

    public function rules(): array
    {
        return [
            'patient_code' => ['nullable', 'string', 'max:64', 'unique:patients,patient_code'],
            'name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'string', 'in:male,female,other'],
            'contact' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'ward' => ['nullable', 'string', 'max:100'],
            'bed_number' => ['nullable', 'string', 'max:50'],
            'diagnosis' => ['nullable', 'string', 'max:255'],
            'attending_physician' => ['nullable', 'string', 'max:150'],
        ];
    }
}

