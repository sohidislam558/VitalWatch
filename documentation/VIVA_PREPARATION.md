# VitalWatch — University Viva Voce & Defense Preparation

This guide is designed for Computer Science & Engineering (CSE) students defending VitalWatch during capstone / final year examinations.

---

## 1. Core System Concept
### What is VitalWatch?
VitalWatch is an academic hospital clinical decision support prototype designed for authorized healthcare professionals (Admins, Doctors, Nurses) to systematically record, monitor, and visualize patient vital signs while automatically identifying threshold violations via a configurable alert engine.

### Why was it developed?
In hospital wards, routine vital signs are often recorded manually on paper charts at the foot of patient beds. This leads to delayed identification of deteriorating physiological trends, lost data, and fragmented communication across shift handoffs. VitalWatch centralizes data entry, visualizes time-series trends, and triggers immediate early warning alerts without attempting to replace professional human diagnosis.

---

## 2. Technical Architecture & Component Responsibilities
- **Frontend (React 19 + Vite + Tailwind CSS):** Handles presentation, role-guarded views, responsive UI components, client-side input validation, Recharts trend graphs, and reactive state management.
- **Backend (Laravel 13 + Sanctum):** Implements business logic, API route endpoints, Form Request validation, authentication/authorization, transaction management, Dompdf generation, and email handling.
- **Database (MySQL via XAMPP):** Stores relational entities (`users`, `patients`, `admissions`, `vital_records`, `alert_rules`, `alerts`, `audit_logs`). Enforces constraints such as unique active admissions and relational foreign keys.

---

## 3. Key Viva Questions & Answers

### Q1: How does frontend and backend communicate?
**Answer:** The React frontend communicates with Laravel via asynchronous HTTP requests using Axios over REST endpoints (`http://localhost:8000/api`). Requests carry the Sanctum authentication Bearer token in the `Authorization` header. Responses follow a standardized JSON format: `{ "success": boolean, "message": string, "data": ... }`.

### Q2: Why is vital record history immutable?
**Answer:** In medical and clinical software, altering or overwriting past clinical observations is a grave safety and legal hazard. VitalWatch stores every measurement as a new row in `vital_records` with a timestamp and foreign key `recorded_by` pointing to the user who entered it. Even administrators cannot silently update past measurement figures.

### Q3: How is duplicate active admission prevented?
**Answer:** Both at the application service level and database level. The `AdmissionService` verifies inside a database transaction that no record with `patient_id = $id` and `status = 'admitted'` exists before creating a new admission. If one exists, the request is rejected with a 422 HTTP unprocessable entity response.

### Q4: How does the Alert Engine evaluate vital signs?
**Answer:** In `VitalService::store()`, after saving the new vital sign record inside a DB transaction, the `AlertService::evaluate()` method loads all active `alert_rules`. It evaluates each parameter (Heart Rate, BP, SpO2, Temp, RR) against the configured threshold using dynamic operators (`>`, `>=`, `<`, `<=`, `==`). If a threshold is crossed, it verifies that no active alert already exists for the same patient and rule, preventing alert fatigue and duplicate notifications.

### Q5: What are the clinical safety limitations?
**Answer:** VitalWatch clearly displays the notice **"DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED"**. Alerts serve strictly as prompts for human clinical review. The software does not diagnose conditions, does not recommend prescription dosages, and never infers safety from absence of alerts.

