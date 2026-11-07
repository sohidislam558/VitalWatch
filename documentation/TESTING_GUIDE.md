# VitalWatch — Testing Guide

## 1. Automated Backend Feature Testing
Execute the complete Laravel PHPUnit test suite:
```powershell
cd d:\VitalWatch\backend
php artisan test
```

### Covered Test Suites
1. **Authentication Tests (`AuthTest.php`):**
   - User login with valid credentials (returns Sanctum token and user object).
   - Rejection of invalid credentials with 422/401 HTTP codes.
   - Deactivated user login prevention.
   - User logout and token revocation.
2. **Patient Management Tests (`PatientTest.php`):**
   - Patient registration and automatic code generation (`PAT-YYYY-XXXX`).
   - Duplicate patient code prevention.
   - Search by name and code.
3. **Admission Management Tests (`AdmissionTest.php`):**
   - Successful admission creation.
   - Rejection of overlapping active admission for the same patient.
   - Patient discharge updates admission status and frees bed.
4. **Vital Records Tests (`VitalTest.php`):**
   - Saving physiological measurements within valid technical ranges.
   - Ensuring past vital measurements cannot be overwritten.
   - Verification that discharged patients cannot receive routine measurements.
5. **Alert Engine Tests (`AlertTest.php`):**
   - Automatic alert creation when vital signs breach active threshold rules.
   - Priority tagging (`review` vs `urgent`).
   - Prevention of duplicate active alerts for the same rule and patient.
   - Alert acknowledgement and resolution workflows.
6. **Reports & Exports Tests (`ReportTest.php`):**
   - Dompdf generation for patient history.
   - Role-based report download access.

---

## 2. Manual End-to-End Browser Testing Checklist
- [ ] Log in as Admin (`admin@vitalwatch.hospital`).
- [ ] Review KPI summary cards on the Central Dashboard.
- [ ] Navigate to Staff Management, register a new user, and test status deactivation.
- [ ] Log in as Nurse (`nurse.john@vitalwatch.hospital`).
- [ ] Register a new patient and admit the patient to ICU Bed 04.
- [ ] Enter a vital reading that crosses a critical threshold (e.g. Heart Rate 145 bpm).
- [ ] Verify that an Urgent alert immediately appears on the Central Dashboard.
- [ ] Log in as Doctor (`doctor.sarah@vitalwatch.hospital`).
- [ ] Open the patient history page, inspect the Recharts trend graphs, and acknowledge the alert with a note.
- [ ] Download and view the multi-page PDF monitoring report.

