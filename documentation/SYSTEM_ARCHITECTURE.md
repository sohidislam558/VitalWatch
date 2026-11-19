# VitalWatch — System Architecture

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                            Hospital Staff Browser Clients                         |
|         Bedside Nurses, Attending Physicians (MO/MD), Hospital Administrators     |
+-----------------------------------------------------------------------------------+
       |                                      ^                         ^
       | HTTP / HTTPS (JSON REST API)         | BroadcastChannel API    | Polling Fallback
       v                                      v ('vitalwatch_telemetry')v
+-----------------------------------------------------------------------------------+
|                        React Single-Page Application (SPA)                        |
| - Vite + React 19 + React Router + Axios + Tailwind CSS                           |
| - Cross-Window Telemetry Sync: Native BroadcastChannel (<50ms latency)             |
| - Situation Monitor: Live patient situation cards & FIFO Bed Allocation Queues     |
| - Doctor Portal: Single-concurrency bedside action & assessment completion        |
| - Nurse Portal: Registration, Bedside Admission, & Manual Vital Signs Input       |
| - Admin Portal: Persistent Governance Navigation, Table-Fixed Audit Stream, KPI   |
| - Vital Trend Logs: Patient-indexed chronological logs with real-time sync        |
+-----------------------------------------------------------------------------------+
       |
       | Axios withCredentials / Bearer Token
       v
+-----------------------------------------------------------------------------------+
|                               Laravel REST API Engine                             |
| - Laravel Sanctum Authentication Middleware                                       |
| - Active Account Verification Middleware (EnsureUserIsActive)                     |
| - Role-Based Authorization Middleware (role:admin, role:doctor, role:nurse)       |
| - Laravel Policies: AdmissionPolicy, VitalRecordPolicy, AlertPolicy, UserPolicy   |
| - Domain Services:                                                                |
|     * AdmissionService: Bed occupancy validation, strict FIFO queue enforcement   |
|     * VitalService: Permanent immutable record persistence & post-ICU entry lock  |
|     * AlertService: Threshold evaluation & single-doctor attendance concurrency   |
|     * AuditService: Structured immutable logging (passwords/tokens omitted)       |
|     * DashboardService: Situational telemetry aggregation & role-filtered feeds   |
|     * EmailService: Resilient emergency SMTP dispatch with email_logs fallback    |
|     * ReportService: Barryvdh Dompdf multi-page PDF generation & streaming        |
+-----------------------------------------------------------------------------------+
          |                          |                     |
          v                          v                     v
+-------------------+      +-------------------+   +--------------------+
|  MySQL Database   |      | Dompdf Engine     |   | SMTP Server        |
|  (vitalwatch_db)  |      | (Clinical Dossier |   | (Emergency Alerts  |
|  InnoDB, utf8mb4  |      |  PDF Generation)  |   |  & ICU Dispatch)   |
+-------------------+      +-------------------+   +--------------------+
```

---

## 2. Component & Layer Responsibilities

### 2.1 Frontend Presentation Layer (React 19 + Vite)
- **Role-Guarded Portals:** Dynamic route protection ensuring nurses access admission/vitals forms, doctors access bedside attendance/assessment tools, and administrators access governance modules.
- **Cross-Window Telemetry Synchronization (`realtime.js`):** Employs the HTML5 `BroadcastChannel` API on channel `vitalwatch_telemetry_sync` for immediate (<50ms) telemetry propagation across browser windows without WebSockets server complexity.
- **Bedside Situation Monitor:** Visualizes hospital wards with plain-English situation indicators (`Emergency`, `Doctor in Action`, `Attention Needed`, `Normal & Stable`, `ICU Observation`).
- **Strict FIFO Priority Queue Banners:** Displays emergency ICU allocation and general ward step-down queues ordered chronologically by request timestamp. Locks non-Priority #1 beds visually to prevent out-of-order allocations.
- **Table-Fixed Responsive Viewport:** The administrative activity stream is engineered with `table-fixed w-full` styling, guaranteeing that the rightmost "Actions" column remains completely within the viewport at 100% zoom without horizontal scrollbars.

### 2.2 Backend Business Layer (Laravel 13)
- **Token-Based Authentication:** Stateless Bearer token authentication via Laravel Sanctum with `EnsureUserIsActive` middleware.
- **Hospital Identity Badge Verification:** Self-registration is restricted to certified hospital personnel by verifying pre-seeded `hospital_staff_identities` badges.
- **Bed Capacity & Occupancy Engine:** Validates that no two active patients can be admitted to the same bed in any ward.
- **Strict Chronological FIFO Queue Validation:** `completeIcuTransfer()` and `completeStepDown()` reject allocations with HTTP `422` if any patient with an earlier request timestamp is still pending.
- **Physician Single-Patient Bedside Concurrency:** `AlertService::markDoctorInAction()` ensures a physician can physically attend only one patient at any given moment.
- **Post-ICU Transfer Vital Entry Lock:** Protects patients transferred to the ICU by blocking nurse vital entry until the attending physician marks their assessment done.
- **Permanent Record Immutability:** `VitalRecordPolicy` denies all update and delete actions (`return false`), satisfying medical record retention laws.

### 2.3 Persistence Layer (MySQL)
- **ACID Transactions (`DB::transaction`):** Ensures atomicity across vital sign storage, alert evaluation, and audit logging.
- **Relational Integrity:** Foreign key constraints with `ON DELETE RESTRICT` preventing accidental deletion of clinical history.
- **Optimized Indexes:** Composite indexes on `(ward, bed_number, status)`, `(patient_id, status)`, and timestamps for sub-50ms dashboard telemetry queries.
