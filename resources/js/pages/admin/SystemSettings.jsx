import React, { useState, useEffect } from 'react';
import LoadingSkeleton from '../../components/UI/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

export default function SystemSettings() {
  const [settingsGrouped, setSettingsGrouped] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      setSettingsGrouped(response.data);
    } catch (error) {
      toast.error('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (group, key, value) => {
    setSettingsGrouped((prev) => {
      const updatedGroup = prev[group].map((item) =>
        item.key === key ? { ...item, value } : item
      );
      return {
        ...prev,
        [group]: updatedGroup
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Flatten settings groups to single list
      const settingsList = Object.values(settingsGrouped).flat();
      await axios.put('/api/settings', { settings: settingsList });
      toast.success('System settings updated successfully.');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settingsGrouped) {
    return <LoadingSkeleton count={3} height="h-32" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">System Settings</h1>
        <p className="text-slate-400 text-sm">Configure global system parameters, email drivers, active modes, and anti-cheat policies.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {Object.keys(settingsGrouped).map((groupName) => (
          <div key={groupName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 border-b pb-2 uppercase tracking-wide">
              {groupName} Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settingsGrouped[groupName].map((setting) => (
                <div key={setting.key} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {setting.label || setting.key.replace('_', ' ')}
                  </label>
                  <input
                    type="text"
                    value={setting.value || ''}
                    onChange={(e) => handleChange(groupName, setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-600/10 focus:outline-none transition-all flex items-center gap-2"
          >
            {saving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
