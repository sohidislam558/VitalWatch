# VitalWatch — System Architecture

## 1. High-Level Architectural Diagram

```
+-------------------------------------------------------------+
|                  Hospital Staff (Browser)                   |
|           Doctors, Nurses, System Administrators            |
+-------------------------------------------------------------+
                              |
                              | HTTP / HTTPS (JSON REST API)
                              v
+-------------------------------------------------------------+
|                React Single-Page Application                |
|           Vite + React Router + Axios + Tailwind CSS        |
|      (State Management, Form Validation, Recharts, Toasts)  |
+-------------------------------------------------------------+
                              |
                              | Axios withCredentials / Bearer
                              v
+-------------------------------------------------------------+
|                     Laravel REST API                        |
| - Sanctum Authentication Middleware                         |
| - Role Middleware (Admin, Doctor, Nurse)                    |
| - Form Request Validation (Zod parity on backend)           |
| - Controllers (Thin dispatchers)                            |
| - Domain Services:                                          |
|     * AuthService, PatientService, AdmissionService        |
|     * VitalService, AlertService, EmailNotificationService  |
|     * ReportService, DashboardService, AuditService         |
| - Eloquent ORM Models & Relationships                       |
+-------------------------------------------------------------+
          |                         |                 |
          v                         v                 v
+------------------+     +-------------------+   +-------------+
|  MySQL Database  |     | Dompdf Engine     |   | SMTP Server |
|  (vitalwatch_db) |     | (PDF Reports)     |   | (Mailtrap / |
|  InnoDB, utf8mb4 |     +-------------------+   | Local Mail) |
+------------------+                             +-------------+
```

## 2. Component Responsibilities

### Frontend Layer (React 19 + Vite)
- **Role-based Navigation & Routing:** Guarded routes checking user roles (`Admin`, `Doctor`, `Nurse`).
- **Data Visualization:** Interactive trend charts using Recharts for 5 physiological vital metrics.
- **Form Interactivity:** Client-side form validation with React Hook Form and Zod for instant feedback.
- **State & Alerts:** Central AuthContext and NotificationContext for alert toasts and live session tracking.

### Backend Layer (Laravel 13)
- **Security & Authorization:** Token/Cookie-based authentication with Laravel Sanctum, route protection with middleware and policies.
- **Business Logic Services:** Isolated services for Alert calculation, admission conflict prevention, and immutable vital logging.
- **Audit Trail:** Automatic recording of all mutating events into `audit_logs` without storing sensitive credentials.
- **PDF Generation:** Server-side streaming of structured medical reports with patient demographics, vital tabular history, and alert flags.

### Database Layer (MySQL)
- Relational integrity with foreign key constraints (`ON DELETE RESTRICT` for clinical history to avoid accidental data loss).
- InnoDB storage engine supporting ACID transactions for vital entry and alert generation.
- Unique constraints enforcing one active admission per patient.

