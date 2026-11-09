<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - VitalWatch Landing & Client Application Entry
|--------------------------------------------------------------------------
| Directly serves the VitalWatch application index.html at http://127.0.0.1:8000/
| and handles client-side routing fallback for non-API web routes.
*/
Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath, [
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
    return view('welcome');
})->where('any', '^(?!(api|assets|favicon)).*$');

