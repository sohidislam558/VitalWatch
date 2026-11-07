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
        Schema::create('vital_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('admission_id')->constrained('admissions')->restrictOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->decimal('heart_rate', 5, 1);
            $table->decimal('systolic_bp', 5, 1);
            $table->decimal('diastolic_bp', 5, 1);
            $table->decimal('spo2', 4, 1);
            $table->decimal('temperature', 4, 1);
            $table->decimal('respiratory_rate', 4, 1);
            $table->text('notes')->nullable();
            $table->dateTime('measured_at');
            $table->timestamps();

            $table->index('patient_id');
            $table->index('admission_id');
            $table->index('measured_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vital_records');
    }
};

