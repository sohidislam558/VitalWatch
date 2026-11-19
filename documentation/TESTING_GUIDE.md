# VitalWatch — Automated & Manual Testing Guide

## 1. Automated Backend Feature Testing

VitalWatch features a comprehensive automated test suite built on PHPUnit and Laravel's feature testing harness.

### Running the Complete Test Suite
```powershell
cd d:\VitalWatch\backend
php artisan test
```

### Test Suite Execution Output
```
Tests:    39 passed (194 assertions)
Duration: ~8.8 seconds
Success:  100% Pass Rate (0 Failures)
```

---

## 2. Test Suite Breakdown & Covered Clinical Scenarios

### 2.1 Admission & Bed Capacity Suite (`AdmissionTest.php` - 11 Tests)
1. `test_cannot_create_duplicate_active_admission`: Validates that a patient cannot be simultaneously admitted to two wards.
2. `test_cannot_admit_to_already_occupied_bed`: Ensures an occupied bed cannot be assigned to another patient.
3. `test_can_fetch_occupied_and_available_beds_by_ward`: Verifies the `/api/admissions/beds` endpoint correctly calculates availability.
4. `test_doctor_can_discharge_and_admin_cannot`: Enforces that only attending physicians can discharge patients (Admins blocked with HTTP 403).
5. `test_doctor_can_request_emergency_icu_transfer_and_nurse_can_complete`: Tests the emergency ICU escalation lifecycle.
6. `test_doctor_can_request_step_down_and_nurse_can_complete`: Tests the ward step-down de-escalation lifecycle.
7. `test_step_down_cannot_target_icu_wards`: Ensures step-downs can only target general or telemetry wards.
8. `test_cannot_request_step_down_when_patient_has_unresolved_alerts`: Rejects step-down requests if the patient is physiologically unstable.
9. `test_nurse_cannot_input_vitals_after_icu_transfer_until_doctor_assessment_done`: Validates post-ICU transfer vital entry lock.
10. `test_cannot_allocate_icu_bed_to_later_priority_patient_before_prior_patient`: **Strict FIFO Priority Queue Enforcement**: Blocks ICU bed allocation to a lower-priority patient if an earlier request is pending.
11. `test_cannot_allocate_step_down_bed_to_later_priority_patient_before_prior_patient`: **Strict FIFO Priority Queue Enforcement**: Blocks general ward allocation if an earlier step-down request is pending.

### 2.2 Alert Engine & Physician Attendance Suite (`AlertTest.php` - 7 Tests)
1. `test_evaluate_heart_rate_tachycardia`: Verifies urgent alert generation when heart rate exceeds threshold (e.g. > 120 bpm).
2. `test_evaluate_spo2_hypoxemia`: Verifies urgent alert generation when SpO2 drops below threshold (e.g. < 90%).
3. `test_staff_can_acknowledge_active_alert`: Tests alarm acknowledgement with clinical notes.
4. `test_doctor_can_mark_in_action_and_single_concurrency_is_enforced`: **Single-Patient Concurrency**: Enforces that a doctor cannot attend more than one patient at a time.
5. `test_doctor_in_action_transitions_all_active_patient_alerts`: Verifies that marking "Doctor in Action" transitions all active alarms for that patient together.
6. `test_assessment_done_transitions_alerts_to_resolved`: Verifies "Assessment Done" resolves alarms and clears attendance locks.
7. `test_vital_entry_in_normal_range_auto_resolves_past_alerts`: Verifies that entering normalized follow-up vitals automatically clears prior alarms and restores "Normal & Stable" status.

### 2.3 Regulatory Audit Suite (`AuditLogTest.php` - 3 Tests)
1. `test_system_logs_vital_recording_in_audit_trail`: Verifies immutable audit logging upon vital entry.
2. `test_admin_can_fetch_and_filter_audit_activities`: Verifies category and query filtering on the audit feed.
3. `test_admin_can_delete_specific_and_date_range_audit_logs`: Verifies date-range and individual log pruning permissions for administrators.

### 2.4 Authentication & Identity Verification Suite (`AuthTest.php` - 3 Tests)
1. `test_staff_can_login_and_receive_bearer_token`: Verifies Sanctum token issuance on valid login.
2. `test_public_registration_enforces_badge_validation`: Verifies staff self-registration requires an authentic, unused hospital identity badge.
3. `test_admin_cannot_register_via_public_endpoint`: Enforces that administrator accounts cannot be self-registered via public endpoints.

### 2.5 Clinical Cycle End-to-End Workflow Suite (`RoleWorkflowTest.php` - 2 Tests)
1. `test_staff_can_register_as_nurse_and_doctor`: End-to-end staff onboarding workflow.
2. `test_complete_hospital_clinical_cycle_nurse_doctor_admin`: Comprehensive full hospital lifecycle test:
   - Nurse admits Patient 1.
   - Doctor attempted vital entry is blocked (403).
   - Nurse records critical vitals &rarr; emergency alarms triggered.
   - Doctor responds bedside with single "Doctor in Action".
   - Doctor requests emergency ICU transfer &rarr; queued in FIFO priority queue.
   - Nurse allocates ICU bed &rarr; patient transferred to ICU.
   - Nurse vital entry is blocked until doctor completes assessment.
   - Doctor marks assessment done &rarr; vital entry unlocked.
   - Patient stabilized &rarr; doctor requests general ward step-down.
   - Bed allocated according to FIFO queue.
   - Doctor clears patient for discharge.
   - Administrator reviews immutable clinical audit trail.

### 2.6 Vital Records & Immutability Suite (`VitalTest.php` - 3 Tests)
1. `test_nurse_can_record_vitals`: Verifies nurse entry of physiological readings.
2. `test_doctor_and_admin_cannot_record_vitals`: Enforces that doctors and admins cannot input vitals (403).
3. `test_vitals_validation_bounds`: Enforces physiological technical limits (rejects impossible readings).

---

## 3. Manual Clinical Walkthrough Checklist

- [ ] **1. Public Staff Registration:**
  - Register as a new Doctor using badge `VW-DOC-1001`.
  - Verify that attempting to register an Admin role is strictly rejected.
- [ ] **2. Nurse Inpatient Admission:**
  - Log in as Nurse (`nurse.john@vitalwatch.hospital`).
  - Register and admit a new patient to "General Medical Ward", Bed "Bed 10".
  - Attempt to admit a second patient to the same bed and verify occupancy rejection.
- [ ] **3. Bedside Vital Entry & Alarm Triggering:**
  - Enter critical vitals: Heart Rate: 138 bpm, SpO2: 88%.
  - Verify that an urgent red alarm triggers instantly on the Situation Monitor.
- [ ] **4. Physician Bedside Response (Single Concurrency):**
  - Log in as Doctor (`doctor.sarah@vitalwatch.hospital`).
  - Click **"🩺 Doctor in Action"** for the deteriorating patient.
  - Attempt to click "Doctor in Action" on a second patient; verify the concurrency lock blocks the action.
- [ ] **5. Emergency ICU Transfer & Strict FIFO Priority Queue:**
  - As Doctor, click **"🚑 Request ICU"**.
  - Have a second patient also request ICU transfer.
  - As Nurse or Admin, attempt to allocate a bed to the second patient first; verify the **Strict FIFO Priority Queue** blocks premature allocation.
  - Allocate an ICU bed for Priority #1; verify success.
- [ ] **6. Post-ICU Transfer Nurse Lockout:**
  - As Nurse, attempt to record vitals for the newly transferred ICU patient; verify entry is locked awaiting physician assessment.
  - As Doctor, click **"✅ Assessment Done"**.
  - As Nurse, verify vital sign entry permissions are now restored.
- [ ] **7. General Ward Step-Down:**
  - As Doctor, click **"🏥 Request Step-Down"**.
  - Verify patient is queued in the Step-Down FIFO queue.
  - Allocate a general ward bed.
- [ ] **8. Physician Discharge:**
  - As Doctor, discharge the patient.
  - Verify Admin and Nurse cannot discharge patients.
- [ ] **9. Admin Clinical Audit Stream:**
  - Log in as Admin (`admin@vitalwatch.hospital`).
  - Verify the audit stream table is contained 100% inside the viewport with the **Actions** column visible without horizontal scrolling.
  - Test date-range filtering, inspection drawer, and log deletion.
