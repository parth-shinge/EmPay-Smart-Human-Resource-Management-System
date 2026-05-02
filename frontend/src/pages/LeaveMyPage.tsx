/**
 * LeaveMyPage — Employee views their own leave requests.
 */
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CalendarDays } from 'lucide-react';

interface LeaveRequest {
  id: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  rejection_reason: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  APPROVED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function LeaveMyPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leave/requests/')
      .then(({ data }) => setRequests(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-xl font-bold font-['Space_Grotesk']">My Leave Requests</h2>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
          <p>No leave requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-5 hover:bg-white/[0.04] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{r.leave_type_name}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {r.start_date} → {r.end_date} ({r.total_days} day{r.total_days > 1 ? 's' : ''})
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{r.reason}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {r.reviewed_by_name && <p>Reviewed by: {r.reviewed_by_name}</p>}
                  {r.rejection_reason && <p className="text-red-400 mt-1">Reason: {r.rejection_reason}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
