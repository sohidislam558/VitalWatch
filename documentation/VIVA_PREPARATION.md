# VitalWatch — University Viva Voce & Defense Preparation

This guide is designed for Computer Science & Engineering (CSE) students defending VitalWatch during capstone / final year examinations.

---

## 1. Core System Concept & Motivation

### What is VitalWatch?
VitalWatch is an academic hospital clinical decision support and patient early warning prototype engineered for authorized healthcare staff (Administrators, Doctors/MOs, Nurses). It centralizes real-time physiological telemetry, identifies threshold violations via an automated alert engine, manages acute patient transfers with strict chronological FIFO queuing, and tracks all clinical actions in an immutable audit trail.

### Why was it developed?
In general hospital wards, vital signs are frequently recorded on paper clipboards at the foot of patient beds. This creates critical clinical vulnerabilities:
1. **Delayed Detection:** Hours can pass before physiological deterioration is noticed by an attending physician.
2. **Divided Attention:** A single physician might attempt to juggle multiple resuscitations simultaneously without clear situational visibility.
3. **Queue Inequity:** In acute bed shortages (e.g. ICU), human error can result in beds being allocated to later requests before earlier, more critical transfers are addressed.
4. **Data Tampering:** Paper charts and editable digital logs can be altered retrospectively, violating medical accountability standards.

---

## 2. Technical Architecture & Component Responsibilities

- **Frontend (React 19 + Vite + Tailwind CSS):** Role-guarded portals, responsive situational awareness displays, client-side input validation, Recharts physiological trend graphs, and cross-window real-time telemetry synchronization via HTML5 `BroadcastChannel`.
- **Backend (Laravel 13 + Sanctum):** Business logic, REST endpoints, Form Request validation, RBAC policies, database transactions, Dompdf report generation, resilient SMTP notification dispatching, and strict FIFO queue evaluation.
- **Database (MySQL 8 via XAMPP):** Relational storage engine (`InnoDB`) with strict foreign key constraints, row-level locks, and unique indexes to enforce single active admissions and bed occupancy.

---

## 3. High-Yield Viva Questions & Answers

### Q1: How does the frontend communicate with the backend?
**Answer:** The React SPA communicates with Laravel via asynchronous HTTP requests using Axios over REST endpoints (`http://localhost:8000/api`). Requests carry the Laravel Sanctum Bearer token in the `Authorization` header. Responses follow a standardized JSON envelope: `{ "success": boolean, "message": string, "data": ... }`.

### Q2: Why are clinical vital records permanently immutable?
**Answer:** Under clinical software regulatory frameworks (e.g., FDA guidelines, HIPAA, Good Clinical Practice), modifying or erasing past physiological measurements is a severe clinical and legal violation. VitalWatch enforces this in `VitalRecordPolicy` where `update()` and `delete()` unconditionally return `false`. Every measurement is an insert-only record with staff and timestamp attribution.

### Q3: How does the Strict FIFO Priority Queue for Bed Allocations work?
**Answer:** When physicians request Emergency ICU or Ward Step-Down transfers, requests are timestamped (`icu_transfer_requested_at`, `step_down_requested_at`). In `AdmissionService::completeIcuTransfer()` and `completeStepDown()`, the system queries for any active admission with an earlier request timestamp. If an earlier request exists, the allocation is rejected with an HTTP `422 Unprocessable Content` error naming the Priority #1 patient. On the frontend, non-priority #1 buttons are visually disabled and locked with `🔒 Awaiting Priority #1 ({patientName})`.

### Q4: How is physician bedside concurrency controlled?
**Answer:** A physician cannot physically provide resuscitation to multiple patients simultaneously. In `AlertService::markDoctorInAction()`, the system checks whether the logged-in doctor already holds an active `doctor_in_action` status on another patient. If so, it blocks the action with a validation error naming their currently attended patient, ward, and bed number, requiring them to complete that assessment before attending another bedside.

### Q5: Why is nurse vital sign entry locked after an ICU transfer?
**Answer:** When an acutely deteriorating patient is escalated to the ICU, their immediate physiological management must be supervised and evaluated by the attending physician (MO/MD). To prevent routine nursing rounds from masking unreviewed post-transfer conditions, `VitalService::record()` rejects vital entries on newly transferred ICU patients until the attending physician marks their initial clinical assessment done (`icu_assessment_done = true`).

### Q6: How does real-time cross-window synchronization work without WebSocket servers?
**Answer:** VitalWatch implements the browser's native HTML5 `BroadcastChannel` API on channel `vitalwatch_telemetry_sync`. Whenever a vital sign is saved, an alarm is resolved, or a patient is transferred, a lightweight event is broadcasted. All open tabs and windows (Nurse Portal, Doctor Portal, Situation Monitor, Vital Trend Logs) receive this event in under 50ms and refresh their telemetry data automatically, supplemented by a 12-second periodic polling fallback.

### Q7: How is bed occupancy conflict prevented?
**Answer:** In `AdmissionService::admitPatient()`, `completeIcuTransfer()`, and `completeStepDown()`, a database query checks if any other admitted patient currently occupies the target `(ward, bed_number)` pair. If occupied, the operation is blocked with a validation error identifying the current occupant.

### Q8: How are administrative audit logs managed and protected?
**Answer:** Every mutating operation (logins, admissions, vital entries, physician actions, alarm resolutions, and transfers) is captured by `AuditService` with the actor's user ID, name, role, IP address, and payload parameters. Sensitive authentication credentials (passwords, tokens) are stripped before storage. Administrators can filter logs by calendar date range, view human-readable inspection drawers, and prune obsolete logs without affecting immutable clinical vital records.

### Q9: How are duplicate titles (e.g. "Dr. Dr." or "Nurse Nurse") prevented?
**Answer:** An Eloquent attribute mutator in the `User` model runs `cleanPersonName()`, regex-stripping any redundant leading titles before persisting or formatting names.

### Q10: What are the clinical safety limitations?
**Answer:** VitalWatch prominently features the safety disclosure **"ACADEMIC SOFTWARE PROTOTYPE — NOT CLINICALLY VALIDATED"**. Alerts serve strictly as prompts for certified human clinical review. The system does not automate medical diagnosis, does not compute drug dosages, and never infers physiological safety from the absence of alerts.
