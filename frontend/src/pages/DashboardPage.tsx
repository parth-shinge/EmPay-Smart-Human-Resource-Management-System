/**
 * Dashboard — role-scoped stats & charts.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Users, Clock, CalendarDays, DollarSign, TrendingUp,
  AlertCircle, CheckCircle, UserCheck, Building2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

interface DashboardStats {
  attendance_this_month?: { present: number; absent: number; leave: number; half_day: number };
  leave_balance?: { type: string; allocated: number; used: number; remaining: number }[];
  latest_payslip?: { month: number; year: number; net_salary: string } | null;
  total_employees?: number;
  present_today?: number;
  on_leave_today?: number;
  pending_leave_requests?: number;
  total_departments?: number;
  department_breakdown?: { department: string; count: number }[];
  latest_payrun?: { month: number; year: number; status: string; total_gross?: string; total_net?: string } | null;
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ icon, label, value, color = 'cyan' }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorMap[color]} border p-5 flex items-start gap-4`}>
      <div className="p-2.5 rounded-lg bg-white/5">{icon}</div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold font-['Space_Grotesk'] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes] = await Promise.all([api.get('/dashboard/stats/')]);
        setStats(statsRes.data);

        if (user?.role === 'ADMIN' || user?.role === 'HR_OFFICER') {
          try {
            const chartRes = await api.get('/dashboard/attendance-chart/');
            setChartData(chartRes.data);
          } catch { /* chart data optional */ }
        }
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEmp = user?.role === 'EMPLOYEE';
  const isHR = user?.role === 'HR_OFFICER' || user?.role === 'ADMIN';
  const isPayroll = user?.role === 'PAYROLL_OFFICER' || user?.role === 'ADMIN';

  const att = stats.attendance_this_month;
  const deptData = stats.department_breakdown?.map((d) => ({ name: d.department, value: d.count })) || [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold font-['Space_Grotesk']">
          Welcome, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Here's your overview for today.
        </p>
      </div>

      {/* Employee stats */}
      {(isEmp || user?.role === 'ADMIN') && att && (
        <>
          <h3 className="text-base font-semibold text-slate-300">My Attendance This Month</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<CheckCircle size={20} className="text-emerald-400" />} label="Present" value={att.present} color="emerald" />
            <StatCard icon={<AlertCircle size={20} className="text-red-400" />} label="Absent" value={att.absent} color="red" />
            <StatCard icon={<CalendarDays size={20} className="text-purple-400" />} label="On Leave" value={att.leave} color="purple" />
            <StatCard icon={<Clock size={20} className="text-amber-400" />} label="Half Day" value={att.half_day} color="amber" />
          </div>
        </>
      )}

      {/* Latest payslip */}
      {(isEmp || user?.role === 'ADMIN') && stats.latest_payslip && (
        <StatCard
          icon={<DollarSign size={20} className="text-cyan-400" />}
          label={`Latest Payslip (${MONTH_NAMES[stats.latest_payslip.month]} ${stats.latest_payslip.year})`}
          value={`₹${Number(stats.latest_payslip.net_salary).toLocaleString('en-IN')}`}
          color="cyan"
        />
      )}

      {/* Leave balance */}
      {(isEmp || user?.role === 'ADMIN') && stats.leave_balance && stats.leave_balance.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-slate-300 mb-3">Leave Balance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.leave_balance.map((lb) => (
              <div key={lb.type} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                <p className="text-xs text-slate-400 mb-2">{lb.type}</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-cyan-400">{lb.remaining}</span>
                  <span className="text-xs text-slate-500 pb-0.5">/ {lb.allocated}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 mt-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                    style={{ width: `${Math.max((lb.remaining / lb.allocated) * 100, 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HR Stats */}
      {isHR && (
        <>
          <h3 className="text-base font-semibold text-slate-300">Organization Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users size={20} className="text-cyan-400" />} label="Total Employees" value={stats.total_employees ?? 0} color="cyan" />
            <StatCard icon={<UserCheck size={20} className="text-emerald-400" />} label="Present Today" value={stats.present_today ?? 0} color="emerald" />
            <StatCard icon={<CalendarDays size={20} className="text-purple-400" />} label="On Leave Today" value={stats.on_leave_today ?? 0} color="purple" />
            <StatCard icon={<Building2 size={20} className="text-blue-400" />} label="Departments" value={stats.total_departments ?? 0} color="blue" />
          </div>
        </>
      )}

      {/* Attendance chart */}
      {isHR && chartData.length > 0 && (
        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
          <h3 className="text-base font-semibold text-slate-300 mb-4">Attendance — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="present" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
              <Bar dataKey="on_leave" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="On Leave" />
              <Bar dataKey="half_day" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Half Day" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Department breakdown pie */}
      {isHR && deptData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
            <h3 className="text-base font-semibold text-slate-300 mb-4">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pending leaves */}
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5 flex flex-col justify-center">
            <StatCard
              icon={<CalendarDays size={20} className="text-amber-400" />}
              label="Pending Leave Requests"
              value={stats.pending_leave_requests ?? 0}
              color="amber"
            />
          </div>
        </div>
      )}

      {/* Payroll stats */}
      {isPayroll && stats.latest_payrun && (
        <div>
          <h3 className="text-base font-semibold text-slate-300 mb-3">Latest Payrun</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={<TrendingUp size={20} className="text-cyan-400" />}
              label={`${MONTH_NAMES[stats.latest_payrun.month]} ${stats.latest_payrun.year} — ${stats.latest_payrun.status}`}
              value={`₹${Number(stats.latest_payrun.total_net ?? 0).toLocaleString('en-IN')}`}
              color="cyan"
            />
            {stats.latest_payrun.total_gross && (
              <StatCard
                icon={<DollarSign size={20} className="text-blue-400" />}
                label="Total Gross"
                value={`₹${Number(stats.latest_payrun.total_gross).toLocaleString('en-IN')}`}
                color="blue"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
