# VitalWatch — Installation & Setup Guide

## 1. Prerequisites
- **Operating System:** Windows 10/11 (or Linux/macOS)
- **Web/DB Server:** XAMPP (Apache + MySQL running on port 3306)
- **PHP:** PHP 8.2+ (verified on PHP 8.5) with extensions: `pdo_mysql`, `mbstring`, `openssl`, `gd`, `zip`
- **Dependency Managers:** Composer 2.x and Node.js v20+ with npm 10+

---

## 2. Database Setup via XAMPP
1. Open the XAMPP Control Panel and start **MySQL** (Default port: `3306`).
2. Open phpMyAdmin (`http://localhost/phpmyadmin`) or MySQL CLI.
3. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS vitalwatch_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

## 3. Quick 1-Click Startup (Recommended for Windows)

In the project root directory, run the automated launch script:
```powershell
.\run-app.bat
# or in PowerShell:
.\run-app.ps1
```
This script verifies dependencies, ensures database connectivity, starts the Laravel backend on `http://127.0.0.1:8000`, and launches the Vite frontend server on `http://localhost:5173`.

---

## 4. Manual Setup Guide

### 4.1 Backend Setup (Laravel)
1. Navigate to the backend directory:
   ```powershell
   cd d:\VitalWatch\backend
   ```
2. Install PHP dependencies:
   ```powershell
   composer install
   ```
3. Copy environment configuration:
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
   *Note: Seeding initializes the administrator account, clinical alert rules, and authorized hospital staff identity badges. The patient roster starts blank.*
6. Start the Laravel development server:
   ```powershell
   php artisan serve --port=8000
   ```
   Backend API will be accessible at `http://127.0.0.1:8000`.

### 4.2 Frontend Setup (React + Vite)
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
4. Build production assets (optional):
   ```powershell
   npm run build
   ```
5. Start the frontend development server:
   ```powershell
   npm run dev
   ```
   Frontend will run at `http://localhost:5173`.

---

## 5. Seeded Credentials & Staff Registration

### Fixed Administrator
- **Email:** `admin@vitalwatch.hospital`
- **Password:** `password`
- **Role:** Administrator (Oversees governance, threshold rules, and audit logs)

### Doctor and Nurse Self-Registration
To reflect hospital employment verification, staff self-register via the public portal (`/register`). Registration requires an authorized, unused **Hospital Identity Badge Number**:

| Role | Authorized Badge Numbers | Departments |
|---|---|---|
| **Doctor** | `VW-DOC-1001` .. `VW-DOC-1005` | Cardiology, ICU, Emergency, Pulmonology, Internal Medicine |
| **Nurse** | `VW-NUR-2001` .. `VW-NUR-2007` | Cardiology ICU, General Ward, Triage, Surgical Recovery |

---

## 6. Running the Automated Test Suite

Execute the backend PHPUnit regression test suite:
```powershell
cd d:\VitalWatch\backend
php artisan test
```
All **39 automated feature tests** (194 assertions) validate authentication, admission enforcement, bed occupancy rules, alert threshold evaluation, doctor single-patient concurrency locks, 1-click assessment completion, strict FIFO ICU and step-down allocation queues, post-transfer nurse vital entry locks, and immutable audit trails.
