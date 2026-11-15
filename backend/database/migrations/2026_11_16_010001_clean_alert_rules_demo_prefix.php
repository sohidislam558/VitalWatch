<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Strip [DEMO] from alert_rules table
        $rules = DB::table('alert_rules')->get();
        foreach ($rules as $rule) {
            $cleaned = preg_replace('/^\[DEMO\]\s*/i', '', $rule->name);
            if ($cleaned !== $rule->name) {
                DB::table('alert_rules')->where('id', $rule->id)->update(['name' => $cleaned]);
            }
        }

        // For existing historical admissions where icu_transferred is true:
        // If there are no unresolved emergency alerts, mark icu_assessment_done as true
        $icuAdmissions = DB::table('admissions')->where('icu_transferred', true)->get();
        foreach ($icuAdmissions as $adm) {
            $hasActiveAlerts = DB::table('alerts')
                ->where('patient_id', $adm->patient_id)
                ->whereIn('status', ['active', 'doctor_in_action'])
                ->exists();

            if (!$hasActiveAlerts) {
                DB::table('admissions')->where('id', $adm->id)->update([
                    'icu_assessment_done' => true,
                    'icu_assessment_done_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
