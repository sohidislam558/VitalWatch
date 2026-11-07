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
        Schema::create('alert_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('parameter', [
                'heart_rate',
                'systolic_bp',
                'diastolic_bp',
                'spo2',
                'temperature',
                'respiratory_rate'
            ]);
            $table->enum('operator', [
                'greater_than',
                'greater_than_or_equal',
                'less_than',
                'less_than_or_equal',
                'equal_to'
            ]);
            $table->decimal('threshold_value', 8, 2);
            $table->enum('priority', ['review', 'urgent']);
            $table->string('message_template');
            $table->boolean('is_active')->default(true);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('parameter');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alert_rules');
    }
};

