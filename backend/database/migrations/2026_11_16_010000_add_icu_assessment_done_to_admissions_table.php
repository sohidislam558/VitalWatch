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
            $table->boolean('icu_assessment_done')->default(false)->after('icu_transferred_at');
            $table->timestamp('icu_assessment_done_at')->nullable()->after('icu_assessment_done');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admissions', function (Blueprint $table) {
            $table->dropColumn(['icu_assessment_done', 'icu_assessment_done_at']);
        });
    }
};
