<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('vital_record_id')->constrained('vital_records')->restrictOnDelete();
            $table->foreignId('alert_rule_id')->constrained('alert_rules')->restrictOnDelete();
            $table->string('message');
            $table->enum('priority', ['review', 'urgent']);
            $table->enum('status', ['active', 'acknowledged', 'resolved'])->default('active');
            $table->timestamps();

            // Prevent duplicate alert for the exact same rule and vital record
            $table->unique(['vital_record_id', 'alert_rule_id'], 'unique_vital_rule_alert');
            $table->index(['patient_id', 'status']);
            $table->index(['priority', 'status']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};

