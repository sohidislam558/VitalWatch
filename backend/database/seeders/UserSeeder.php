<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * No demo users are seeded; only the fixed admin user is created via AdminSeeder.
     * Real staff members register via the public registration portal.
     */
    public function run(): void
    {
        // Intentionally empty. Demo users are disabled.
    }
}
