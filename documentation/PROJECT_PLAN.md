# VitalWatch — Project Plan & Roadmap

## 1. Project Overview
- **Project Name:** VitalWatch
- **Full Title:** VitalWatch: A Web-Based Hospital Patient Vital Signs Monitoring and Early Warning System
- **Domain:** Hospital Patient Monitoring & Clinical Decision Support Prototype
- **Environment:** Manual vital signs entry by authorized healthcare staff (Doctor, Nurse, Administrator)
- **Academic Context:** CSE Undergraduate Capstone / Field-work Prototype
- **Project Status:** **All Phases (0 through 12) Completed & Production Verified**

---

## 2. Goals & Objectives
1. **Centralized Patient Management:** Provide patient registration, multi-admission tracking, and ward/bed assignment without duplicate active admissions or bed double-booking.
2. **Standardized Manual Vital Entry:** Enable accurate, validated entry of physiological parameters (Heart Rate, Systolic BP, Diastolic BP, SpO2, Temperature, Respiratory Rate) with timestamp and nurse attribution.
3. **Automated Configurable Alert Engine:** Instantly evaluate recorded vitals against configurable clinical rules in transactional execution, preventing duplicate active alerts.
4. **Bedside Situation Monitor:** Real-time situational awareness displays with plain-English patient status indicators and immediate emergency alert visibility.
5. **Physician Bedside Concurrency Controls:** Single-patient attendance limit ensuring doctors attend only one bedside at a time.
6. **Strict FIFO Priority Queue for Bed Allocations:** Chronological queue ordering for emergency ICU escalations and ward step-down de-escalations.
7. **Post-Transfer Clinical Protection:** Post-ICU transfer vital entry lock until the attending physician marks their initial clinical assessment done.
8. **Permanent Clinical Record Immutability:** Write-once vital sign persistence with zero update or delete endpoints.
9. **Regulatory Auditing & Governance:** Comprehensive enterprise audit stream with date-range filters, human-readable inspection drawers, and safe deletion controls.
10. **High-Fidelity Reporting & Live Sync:** Dompdf multi-page PDF generation, printable clinical layouts, and cross-window real-time telemetry synchronization via HTML5 `BroadcastChannel`.

---

## 3. Technology Stack & Environment
| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router DOM, Axios, Recharts, Lucide React, React Hook Form, Zod, React Hot Toast, date-fns, BroadcastChannel API |
| **Backend** | PHP 8.2+, Laravel 13, Laravel Sanctum, Form Requests, Eloquent ORM, Laravel Mail & Notifications, Barryvdh Laravel-Dompdf |
| **Database** | MySQL 8.x (XAMPP), utf8mb4 charset, InnoDB storage engine |
| **Dev Environment** | Windows 10/11, PowerShell, Node.js v20+, npm 10+, Composer 2.x |

---

## 4. Phase-by-Phase Roadmap & Delivery Status

- [x] **Phase 0:** Project Planning, Environment Inspection & Scaffolding
- [x] **Phase 1:** Laravel Backend Foundation, Models & Migrations
- [x] **Phase 2:** Authentication (Sanctum), RBAC & Clinical Policies
- [x] **Phase 3:** Patient Roster & Hospital Admission Management
- [x] **Phase 4:** Manual Vital Signs Entry & Permanent Historical Storage
- [x] **Phase 5:** Configurable Alert Engine & Acknowledgement Workflow
- [x] **Phase 6:** React Frontend Foundation, Layout & Navigation
- [x] **Phase 7:** Central Hospital Dashboard & Situation Monitor UI
- [x] **Phase 8:** Vital History Charts & Alert Management UI
- [x] **Phase 9:** Multi-page PDF Reports, Print Layouts & Email Notifications
- [x] **Phase 10:** Integration & Quality Assurance (Automated Tests)
- [x] **Phase 11:** Acute Transfers & Priority Queue Enforcement (ICU & Step-Down)
- [x] **Phase 12:** Enterprise Clinical Audit, Real-Time Sync & System Audit Report
