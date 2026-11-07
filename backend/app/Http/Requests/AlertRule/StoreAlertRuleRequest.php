<?php

namespace App\Http\Requests\AlertRule;

use Illuminate\Foundation\Http\FormRequest;

class StoreAlertRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'parameter' => ['required', 'string', 'in:heart_rate,systolic_bp,diastolic_bp,spo2,temperature,respiratory_rate'],
            'operator' => ['required', 'string', 'in:greater_than,greater_than_or_equal,less_than,less_than_or_equal,equal_to'],
            'threshold_value' => ['required', 'numeric'],
            'priority' => ['required', 'string', 'in:review,urgent'],
            'message_template' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}

