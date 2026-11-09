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
            $table->boolean('icu_transfer_requested')->default(false)->after('status');
            $table->timestamp('icu_transfer_requested_at')->nullable()->after('icu_transfer_requested');
            $table->foreignId('icu_transfer_requested_by')->nullable()->after('icu_transfer_requested_at')->constrained('users')->nullOnDelete();
            $table->string('target_icu_ward')->nullable()->after('icu_transfer_requested_by');
            $table->text('icu_transfer_notes')->nullable()->after('target_icu_ward');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admissions', function (Blueprint $table) {
            $table->dropForeign(['icu_transfer_requested_by']);
            $table->dropColumn([
                'icu_transfer_requested',
                'icu_transfer_requested_at',
                'icu_transfer_requested_by',
                'target_icu_ward',
                'icu_transfer_notes',
            ]);
        });
    }
};
