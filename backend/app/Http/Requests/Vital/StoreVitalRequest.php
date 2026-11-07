<?php

namespace App\Http\Requests\Vital;

use Illuminate\Foundation\Http\FormRequest;

class StoreVitalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'nurse'], true);
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'admission_id' => ['required', 'integer', 'exists:admissions,id'],
            'heart_rate' => ['required', 'numeric', 'min:20', 'max:280'],
            'systolic_bp' => ['required', 'numeric', 'min:40', 'max:280'],
            'diastolic_bp' => ['required', 'numeric', 'min:20', 'max:180'],
            'spo2' => ['required', 'numeric', 'min:50', 'max:100'],
            'temperature' => ['required', 'numeric', 'min:25.0', 'max:45.0'],
            'respiratory_rate' => ['required', 'numeric', 'min:4', 'max:60'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'measured_at' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'heart_rate.min' => 'Heart rate must be at least 20 bpm.',
            'heart_rate.max' => 'Heart rate cannot exceed 280 bpm.',
            'spo2.min' => 'SpO2 must be at least 50%.',
            'spo2.max' => 'SpO2 cannot exceed 100%.',
            'temperature.min' => 'Body temperature must be at least 25°C.',
            'temperature.max' => 'Body temperature cannot exceed 45°C.',
        ];
    }
}

