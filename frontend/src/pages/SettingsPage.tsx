/**
 * SettingsPage — Admin manages organization settings, leave types, etc.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Settings, Plus, Save } from 'lucide-react';

interface LeaveType {
  id: string;
  name: string;
  max_days_per_year: number;
  is_paid: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leave/types/')
      .then(({ data }) => setLeaveTypes(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold font-['Space_Grotesk']">Settings</h2>

      {/* Organization Info */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
        <h3 className="text-base font-semibold text-slate-300 mb-3">Organization</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Organization Name</p>
            <p className="mt-0.5 font-medium">{user?.organization?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Admin</p>
            <p className="mt-0.5 font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Admin Email</p>
            <p className="mt-0.5 text-slate-300">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Leave Types */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
        <h3 className="text-base font-semibold text-slate-300 mb-3">Leave Types</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : leaveTypes.length === 0 ? (
          <p className="text-sm text-slate-500">No leave types configured.</p>
        ) : (
          <div className="space-y-2">
            {leaveTypes.map((lt) => (
              <div key={lt.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div>
                  <p className="font-medium text-sm">{lt.name}</p>
                  <p className="text-xs text-slate-500">{lt.is_paid ? 'Paid' : 'Unpaid'}</p>
                </div>
                <span className="text-sm text-cyan-400 font-semibold">{lt.max_days_per_year} days/year</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
        <h3 className="text-base font-semibold text-slate-300 mb-3">System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Platform</p>
            <p className="mt-0.5">EmPay v1.0</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Environment</p>
            <p className="mt-0.5 text-emerald-400">Development</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Backend</p>
            <p className="mt-0.5">Django + DRF</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Frontend</p>
            <p className="mt-0.5">React + Vite + Tailwind</p>
          </div>
        </div>
      </div>
    </div>
  );
}
