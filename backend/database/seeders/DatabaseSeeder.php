<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Only the Admin user, Alert threshold rules, and Hospital badge identities are seeded.
        // All patients and vitals are blank by default. A registered nurse registers patients.
        $this->call([
            AdminSeeder::class,
            AlertRuleSeeder::class,
            HospitalIdentitySeeder::class,
        ]);
    }
}
