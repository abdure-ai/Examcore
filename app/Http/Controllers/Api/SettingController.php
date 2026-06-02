<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        return response()->json(Setting::all()->groupBy('group'));
    }

    public function update(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|exists:settings,key',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($data['settings'] as $settingData) {
            Setting::set($settingData['key'], $settingData['value']);
        }

        AuditLog::record('settings.updated', null, $data['settings']);

        return response()->json(['message' => 'Settings updated successfully.']);
    }
}
