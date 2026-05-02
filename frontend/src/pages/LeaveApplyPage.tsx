/**
 * LeaveApplyPage — Employee applies for leave.
 */
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CalendarDays, Send } from 'lucide-react';

interface LeaveType {
  id: string;
  name: string;
  max_days_per_year: number;
  is_paid: boolean;
}

interface LeaveBalance {
  leave_type: string;
  allocated: number;
  used: number;
  remaining: number;
}

export default function LeaveApplyPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/leave/types/').then(({ data }) => setLeaveTypes(data.results || data));
    api.get('/leave/balance/').then(({ data }) => setBalances(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leave/requests/', form);
      toast.success('Leave request submitted!');
      setForm({ leave_type: '', start_date: '', end_date: '', reason: '' });
      // Refresh balances
      api.get('/leave/balance/').then(({ data }) => setBalances(data));
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Submission failed';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold font-['Space_Grotesk']">Apply for Leave</h2>

      {/* Balance cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {balances.map((b) => (
            <div key={b.leave_type} className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
              <p className="text-xs text-slate-400">{b.leave_type}</p>
              <p className="text-lg font-bold text-cyan-400 mt-1">{b.remaining}<span className="text-xs text-slate-500">/{b.allocated}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-white/[0.03] border border-white/5 p-6 space-y-5">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Leave Type</label>
          <select
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
          >
            <option value="">Select leave type...</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>{lt.name} ({lt.is_paid ? 'Paid' : 'Unpaid'})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none"
            placeholder="Reason for leave..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          <Send size={16} />
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
