/**
 * AttendancePage — Employee check-in/out + attendance history.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Clock, LogIn, LogOut, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  working_hours: string;
  notes: string;
}

const statusColors: Record<string, string> = {
  PRESENT: 'text-emerald-400 bg-emerald-500/10',
  ABSENT: 'text-red-400 bg-red-500/10',
  HALF_DAY: 'text-amber-400 bg-amber-500/10',
  ON_LEAVE: 'text-purple-400 bg-purple-500/10',
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchRecords = async () => {
    try {
      const { data } = await api.get('/attendance/my/', { params: { month, year } });
      const recs = data.results || data;
      setRecords(recs);
      // Check today's status
      const today = new Date().toISOString().split('T')[0];
      const todayRec = recs.find((r: AttendanceRecord) => r.date === today);
      if (todayRec) {
        setCheckedIn(true);
        if (todayRec.check_out) setCheckedOut(true);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [month, year]);

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/checkin/', {});
      toast.success('Checked in successfully!');
      setCheckedIn(true);
      fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/checkout/', {});
      toast.success('Checked out successfully!');
      setCheckedOut(true);
      fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Check-out failed');
    }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Clock Card */}
      <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{dateStr}</p>
            <p className="text-4xl font-bold font-['Space_Grotesk'] mt-1">{timeStr}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={checkedIn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <LogIn size={16} />
              {checkedIn ? 'Checked In' : 'Check In'}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!checkedIn || checkedOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              {checkedOut ? 'Checked Out' : 'Check Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2026, i).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          {[2025, 2026, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Records Table */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">#</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Check In</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Check Out</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Hours</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">No records found</td></tr>
            ) : records.map((r, idx) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                <td className="px-4 py-3">{r.date}</td>
                <td className="px-4 py-3 text-slate-300">{r.check_in || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{r.check_out || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{r.working_hours}h</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status] || 'text-slate-400 bg-white/5'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
