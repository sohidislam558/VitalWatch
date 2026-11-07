# VitalWatch — Installation & Setup Guide

## 1. Prerequisites
- **Operating System:** Windows 10/11 (or Linux/macOS)
- **Web/DB Server:** XAMPP (Apache + MySQL running on port 3306)
- **PHP:** PHP 8.2+ (verified on PHP 8.5)
- **Dependency Managers:** Composer 2.x and Node.js v20+ with npm 10+

---

## 2. Database Setup via XAMPP
1. Open XAMPP Control Panel and start **MySQL** (Default port: `3306`).
2. Open phpMyAdmin (`http://localhost/phpmyadmin`) or MySQL CLI.
3. Create database:
   ```sql
   CREATE DATABASE IF NOT EXISTS vitalwatch_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

## 3. Backend Setup (Laravel)
1. Navigate to the backend directory:
   ```powershell
   cd d:\VitalWatch\backend
   ```
2. Install PHP dependencies:
   ```powershell
   composer install
   ```
3. Copy the environment configuration:
   ```powershell
   cp .env.example .env
   ```
4. Generate the application key:
   ```powershell
   php artisan key:generate
   ```
5. Run migrations and database seeders:
   ```powershell
   php artisan migrate:fresh --seed
   ```
6. Start the Laravel development server:
   ```powershell
   php artisan serve --port=8000
   ```
   Backend will be reachable at `http://localhost:8000`.

---

## 4. Frontend Setup (React + Vite)
1. Navigate to the frontend directory:
   ```powershell
   cd d:\VitalWatch\frontend
   ```
2. Install Node dependencies:
   ```powershell
   npm install
   ```
3. Copy environment configuration:
   ```powershell
   cp .env.example .env
   ```
4. Start the frontend Vite development server:
   ```powershell
   npm run dev
   ```
   Frontend will run at `http://localhost:5173`.

---

## 5. Default Demonstration Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@vitalwatch.hospital` | `password` |
| **Doctor** | `doctor.sarah@vitalwatch.hospital` | `password` |
| **Nurse** | `nurse.john@vitalwatch.hospital` | `password` |
| **Nurse** | `nurse.emily@vitalwatch.hospital` | `password` |

