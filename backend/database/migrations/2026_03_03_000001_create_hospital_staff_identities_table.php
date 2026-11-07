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
        // Add hospital identity number to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('hospital_id_number', 64)->nullable()->unique()->after('email');
        });

        // Hospital Authorized Staff Identity Registry
        Schema::create('hospital_staff_identities', function (Blueprint $table) {
            $table->id();
            $table->string('identity_number', 64)->unique();
            $table->enum('role', ['doctor', 'nurse']);
            $table->string('department', 100)->default('General Medicine');
            $table->string('issued_to_name', 150)->nullable();
            $table->boolean('is_claimed')->default(false);
            $table->timestamp('claimed_at')->nullable();
            $table->foreignId('claimed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['identity_number', 'role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hospital_staff_identities');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('hospital_id_number');
        });
    }
};

