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
        DB::statement("ALTER TABLE alerts MODIFY COLUMN status ENUM('active', 'doctor_in_action', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active'");
        DB::statement("ALTER TABLE alert_acknowledgements MODIFY COLUMN action ENUM('acknowledged', 'doctor_in_action', 'resolved') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE alerts MODIFY COLUMN status ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active'");
        DB::statement("ALTER TABLE alert_acknowledgements MODIFY COLUMN action ENUM('acknowledged', 'resolved') NOT NULL");
    }
};

