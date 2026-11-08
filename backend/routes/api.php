<?php

use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AlertRuleController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VitalController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

/*
|--------------------------------------------------------------------------
| Protected Authenticated Routes (Sanctum + Active Status Middleware)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    // Auth Session
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/summary', [DashboardController::class, 'summary']);
        Route::get('/patients', [DashboardController::class, 'patients']);
        Route::get('/alerts', [DashboardController::class, 'alerts']);
        Route::get('/activities', [DashboardController::class, 'activities']);
    });

    // Patients
    Route::get('/patients', [PatientController::class, 'index']);
    Route::post('/patients', [PatientController::class, 'store']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);
    Route::put('/patients/{id}', [PatientController::class, 'update']);
    Route::delete('/patients/{id}', [PatientController::class, 'destroy']);
    Route::get('/patients/{id}/admissions', [PatientController::class, 'admissions']);
    Route::get('/patients/{id}/vitals', [VitalController::class, 'patientVitals']);

    // Admissions
    Route::get('/admissions', [AdmissionController::class, 'index']);
    Route::post('/admissions', [AdmissionController::class, 'store']);
    Route::get('/admissions/{id}', [AdmissionController::class, 'show']);
    Route::patch('/admissions/{id}/discharge', [AdmissionController::class, 'discharge']);

    // Vital Records
    Route::get('/vitals', [VitalController::class, 'index']);
    Route::post('/vitals', [VitalController::class, 'store']);
    Route::get('/vitals/{id}', [VitalController::class, 'show']);

    // Alerts
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::get('/alerts/{id}', [AlertController::class, 'show']);
    Route::patch('/alerts/{id}/doctor-in-action', [AlertController::class, 'doctorInAction']);
    Route::patch('/alerts/{id}/assessment-done', [AlertController::class, 'assessmentDone']);
    Route::patch('/alerts/{id}/acknowledge', [AlertController::class, 'acknowledge']);
    Route::patch('/alerts/{id}/resolve', [AlertController::class, 'resolve']);
    Route::get('/alerts/{id}/history', [AlertController::class, 'history']);

    // Alert Rules (Listing accessible to all authenticated, modifications admin only)
    Route::get('/alert-rules', [AlertRuleController::class, 'index']);
    Route::middleware('role:admin')->group(function () {
        Route::post('/alert-rules', [AlertRuleController::class, 'store']);
        Route::put('/alert-rules/{id}', [AlertRuleController::class, 'update']);
        Route::patch('/alert-rules/{id}/status', [AlertRuleController::class, 'updateStatus']);
    });

    // Reports
    Route::get('/reports/patients/{id}', [ReportController::class, 'show']);
    Route::get('/reports/patients/{id}/pdf', [ReportController::class, 'downloadPdf']);

    // Admin Only: Users and Audit Logs
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus']);

        Route::get('/audit-logs', [AuditController::class, 'index']);
    });
});
