<?php

use Illuminate\Support\Facades\Route;

// Serve the Single Page Application for all routes except api/
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|up).*$');
