/**
 * LeaveManagePage — Admin/Payroll approve/reject pending leave requests.
 */
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Check, X, CalendarDays } from 'lucide-react';

interface LeaveRequest {
  id: string;
  employee_name: string;
  employee_email: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  reviewed_by_name: string | null;
}

const statusColors: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10',
  APPROVED: 'text-emerald-400 bg-emerald-500/10',
  REJECTED: 'text-red-400 bg-red-500/10',
};

export default function LeaveManagePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = { page_size: 200 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/leave/requests/all/', { params });
      let allResults: LeaveRequest[] = data.results || data;
      // Fetch remaining pages if paginated
      if (data.count && data.results && data.count > allResults.length) {
        const totalPages = Math.ceil(data.count / 200);
        for (let p = 2; p <= totalPages; p++) {
          const { data: pageData } = await api.get('/leave/requests/all/', { params: { ...params, page: p } });
          allResults = [...allResults, ...(pageData.results || pageData)];
        }
      }
      setRequests(allResults);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const handleDecision = async (id: string, status: 'APPROVED' | 'REJECTED', rejection_reason = '') => {
    try {
      await api.patch(`/leave/requests/${id}/decide/`, { status, rejection_reason });
      toast.success(`Leave ${status.toLowerCase()}!`);
      setRejectId(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Action failed');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-['Space_Grotesk']">Manage Leave Requests</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Records count */}
      {!loading && requests.length > 0 && (
        <p className="text-xs text-slate-500">{requests.length} leave request{requests.length !== 1 ? 's' : ''} shown</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
          <p>No {statusFilter.toLowerCase()} leave requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold">{r.employee_name}</h3>
                    <span className="text-xs text-slate-500">{r.employee_email}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full ${statusColors[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1.5">
                    <span className="text-cyan-400 font-medium">{r.leave_type_name}</span> — {r.start_date} → {r.end_date} ({r.total_days} day{r.total_days > 1 ? 's' : ''})
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{r.reason}</p>
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDecision(r.id, 'APPROVED')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectId(r.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors"
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Reject modal inline */}
              {rejectId === r.id && (
                <div className="mt-4 p-4 rounded-lg bg-white/[0.03] border border-red-500/20 space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (required)..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(r.id, 'REJECTED', rejectReason)}
                      disabled={!rejectReason.trim()}
                      className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 text-sm font-medium transition-colors"
                    >
                      Confirm Reject
                    </button>
                    <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-slate-400 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
