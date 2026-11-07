# VitalWatch: A Web-Based Hospital Patient Vital Signs Monitoring and Early Warning System

> [!NOTE]
> **ACADEMIC SOFTWARE PROTOTYPE — NOT CLINICALLY VALIDATED.**
> VitalWatch is an academic prototype developed for hospital staff workflow optimization. It is not an automated medical diagnostic tool.

---

## 1. Project Overview

VitalWatch is a hospital-based patient vital signs monitoring and early warning support system. It provides three distinct user roles with dedicated interfaces:

1. **Registered Nurse / Bedside Caregiver**:
   - Register and admit patients to wards (e.g., Cardiology ICU, Bed 101).
   - Manually input vital signs (Heart Rate, Systolic/Diastolic BP, SpO2, Temperature, Respiratory Rate).
   - Observe the **Bedside Situation Monitor** displaying plain-English, real-time patient conditions.
   - Recording normalized follow-up vitals automatically clears alarms and restores status to **Normal & Stable**.

2. **Attending Doctor / Physician**:
   - View real-time patient situation telemetry and vital trend charts (read-only for vital inputs).
   - Instant emergency notifications triggered when vital signs breach threshold rules.
   - Respond at bedside with **"🩺 Doctor in Action"**.
   - **Single-Patient Concurrency Limit**: A doctor can only attend **one patient at a time**.
   - Simple 1-click **"✅ Assessment Done"** to resolve the emergency alert and become available for other patients.

3. **Hospital Administrator**:
   - Oversee the live hospital activity stream (vitals recorded by nurses and bedside actions by doctors).
   - Manage hospital staff accounts, ward directories, threshold rules, and PDF clinical reports.

---

## 2. Directory Structure

```
VitalWatch/
├── backend/            # Laravel 13 REST API Application & public production SPA
├── frontend/           # React 19 + Tailwind CSS Single Page Application
├── documentation/      # System architecture, database design, API & testing guides
├── README.md           # Master documentation
└── .gitignore          # Repository ignore rules
```

---

## 3. Quick Start Guide

### Prerequisites
- **XAMPP** with MySQL running on port 3306.
- **PHP 8.2+** with `pdo_mysql`, `mbstring`, `openssl`, `gd`, `zip`.
- **Composer 2.x**
- **Node.js v20+** & **npm**

### Step 1: Database Setup
Make sure MySQL is running in XAMPP. Create the database:
```sql
CREATE DATABASE IF NOT EXISTS vitalwatch_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations and database seeds:
```powershell
cd backend
php artisan migrate:fresh --seed
```
*Note: Seeding only initializes the system administrator, threshold rules, and hospital identity badges. The patient roster starts completely blank.*

### Step 2: Running the Application

You can start the full stack by running:
```powershell
.\run-app.bat
# or in PowerShell:
.\run-app.ps1
```

Or run the backend directly:
```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```
- **Hospital Portal Landing Page:** `http://127.0.0.1:8000/`

For frontend development mode with hot-module reload:
```powershell
cd frontend
npm run dev
```
- **Vite Dev Server:** `http://localhost:5173`

---

## 4. Default Seeded Credentials

### Fixed Administrator
- **Email:** `admin@vitalwatch.hospital`
- **Password:** `password`

### Doctor and Nurse Registration
Hospital staff self-register via the portal. To verify hospital employment, registration requires an authorized **Hospital Identity Number**:

| Role | Authorized Badge Numbers | Department |
|---|---|---|
| **Doctor** | `VW-DOC-1001` .. `VW-DOC-1005` | Cardiology, ICU, Emergency, Pulmonology, Internal Medicine |
| **Nurse** | `VW-NUR-2001` .. `VW-NUR-2007` | Cardiology ICU, General Ward, Triage, Surgical Recovery |

---

## 5. Running Automated Tests

Run the complete backend test suite:
```powershell
cd backend
php artisan test
```
All 19 automated feature tests validate authentication, admission enforcement, alert threshold evaluation, doctor concurrency locks, 1-click assessment completion, and audit trails.
