import React, { useState, useEffect } from 'react';
import DataTable from '../../components/UI/DataTable';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';
import { fmtDate } from '../../utils/date';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications.data || []);
    } catch (error) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      toast.success('Notification marked as read.');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      toast.success('All notifications marked as read.');
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to clear notifications.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Notifications</h1>
          <p className="text-slate-400 text-sm">System updates, exam results, and course alerts.</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold border border-indigo-200/80 px-4 py-2 rounded-xl"
          >
            Mark all read
          </button>
        )}
      </div>

      <DataTable
        headers={['Message', 'Received On', 'Status', 'Actions']}
        items={notifications}
        isLoading={loading}
        renderRow={(n) => (
          <tr key={n.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-sm ${!n.read_at ? 'bg-indigo-500/5' : ''}`}>
            <td className={`px-6 py-4 ${!n.read_at ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
              {n.data.message || 'New system update'}
            </td>
            <td className="px-6 py-4 text-slate-400 text-xs">
              {fmtDate(n.created_at)}
            </td>
            <td className="px-6 py-4">
              <span className={`h-2.5 w-2.5 rounded-full inline-block ${!n.read_at ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
            </td>
            <td className="px-6 py-4">
              {!n.read_at && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Mark as read
                </button>
              )}
            </td>
          </tr>
        )}
        emptyMessage="You have no notifications."
      />
    </div>
  );
}
