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
        Schema::table('admissions', function (Blueprint $table) {
            $table->boolean('step_down_requested')->default(false)->after('icu_transferred_at');
            $table->timestamp('step_down_requested_at')->nullable()->after('step_down_requested');
            $table->foreignId('step_down_requested_by')->nullable()->after('step_down_requested_at')->constrained('users')->nullOnDelete();
            $table->string('target_step_down_ward')->nullable()->after('step_down_requested_by');
            $table->text('step_down_notes')->nullable()->after('target_step_down_ward');
            $table->boolean('step_down_completed')->default(false)->after('step_down_notes');
            $table->timestamp('step_down_completed_at')->nullable()->after('step_down_completed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admissions', function (Blueprint $table) {
            $table->dropForeign(['step_down_requested_by']);
            $table->dropColumn([
                'step_down_requested',
                'step_down_requested_at',
                'step_down_requested_by',
                'target_step_down_ward',
                'step_down_notes',
                'step_down_completed',
                'step_down_completed_at',
            ]);
        });
    }
};
