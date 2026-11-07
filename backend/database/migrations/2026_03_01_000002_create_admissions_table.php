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
        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->string('ward', 100);
            $table->string('bed_number', 50);
            $table->dateTime('admitted_at');
            $table->dateTime('discharged_at')->nullable();
            $table->enum('status', ['admitted', 'discharged'])->default('admitted');
            $table->timestamps();

            $table->index(['patient_id', 'status']);
            $table->index('ward');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admissions');
    }
};

