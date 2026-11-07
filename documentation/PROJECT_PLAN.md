# VitalWatch — Project Plan

## 1. Project Overview
- **Project Name:** VitalWatch
- **Full Title:** VitalWatch: A Web-Based Hospital Patient Vital Signs Monitoring and Early Warning System
- **Domain:** Hospital Patient Monitoring & Clinical Decision Support Prototype
- **Environment:** Manual vital signs entry by authorized healthcare staff (Doctor, Nurse, Administrator)
- **Academic Context:** CSE Undergraduate Capstone / Field-work Prototype

## 2. Goals & Objectives
1. **Centralized Patient Management:** Provide patient registration, multi-admission tracking, and ward/bed assignment without duplicate active admissions.
2. **Standardized Manual Vital Entry:** Enable accurate, validated entry of key physiological parameters (Heart Rate, Systolic BP, Diastolic BP, SpO2, Body Temperature, Respiratory Rate) with timestamp and staff attribution.
3. **Automated Configurable Alert Engine:** Instantly evaluate recorded vitals against configurable clinical rules (Review / Urgent priority) in transactional execution, preventing duplicate active alerts.
4. **Real-Time Monitoring Dashboard:** Central hospital dashboard displaying current ward statuses, admitted patient summaries, real-time alerts, and critical physiological thresholds.
5. **Auditing & Traceability:** Immutable audit logging for all critical operations (auth, admissions, vital sign entry, alert triage, rule updates).
6. **Reporting & Communication:** High-fidelity multi-page PDF generation via `barryvdh/laravel-dompdf`, browser-friendly print layouts, and SMTP email notifications with fallback resilience.

## 3. Technology Stack & Environment
| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router DOM, Axios, Recharts, Lucide React, React Hook Form, Zod, React Hot Toast, date-fns |
| **Backend** | PHP 8.5+, Laravel 13, Laravel Sanctum, Form Requests, Eloquent ORM, Laravel Mail & Notifications, Barryvdh Laravel-Dompdf |
| **Database** | MySQL 8.x / MariaDB (XAMPP), utf8mb4 charset, InnoDB storage engine |
| **Dev Environment** | Windows 10/11, PowerShell, Node.js v24, npm 11, Composer 2.10 |

## 4. Phase-by-Phase Roadmap
- [x] **Phase 0:** Project Planning, Environment Inspection & Scaffolding
- [ ] **Phase 1:** Laravel Backend Foundation & Database Migrations
- [ ] **Phase 2:** Authentication (Sanctum), RBAC & Policies
- [ ] **Phase 3:** Patient & Hospital Admission Management
- [ ] **Phase 4:** Manual Vital Signs Entry & Historical Storage
- [ ] **Phase 5:** Configurable Alert Engine & Acknowledgement Workflow
- [ ] **Phase 6:** React Frontend Foundation, Layout & Navigation
- [ ] **Phase 7:** Central Hospital Dashboard & Patient UI
- [ ] **Phase 8:** Vital History Charts & Alert Management UI
- [ ] **Phase 9:** Multi-page PDF Reports, Print Layouts & Email Notifications
- [ ] **Phase 10:** End-to-End Integration, Automated Tests & Verification

