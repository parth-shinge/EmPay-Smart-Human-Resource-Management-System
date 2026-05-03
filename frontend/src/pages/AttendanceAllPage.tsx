/**
 * AttendanceAllPage — HR/Admin view all attendance records with filters.
 * Includes department column and department dropdown filter.
 */
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Filter } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employee_name: string;
  employee_email: string;
  employee_department: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  working_hours: string;
}

const statusColors: Record<string, string> = {
  PRESENT: 'text-emerald-400 bg-emerald-500/10',
  ABSENT: 'text-red-400 bg-red-500/10',
  HALF_DAY: 'text-amber-400 bg-amber-500/10',
  ON_LEAVE: 'text-purple-400 bg-purple-500/10',
};

export default function AttendanceAllPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(4); // Default to April (seeded data)
  const [year, setYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch unique departments from employee list
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const { data } = await api.get('/employees/', { params: { page_size: 100 } });
        const list: any[] = data.results || data;
        const deptSet = new Set<string>();
        list.forEach((e) => {
          if (e.department) deptSet.add(e.department);
        });
        // If we got fewer results than total, fetch more pages
        if (data.count && data.count > list.length) {
          const totalPages = Math.ceil(data.count / 100);
          for (let p = 2; p <= totalPages; p++) {
            const { data: pageData } = await api.get('/employees/', { params: { page_size: 100, page: p } });
            const pageList: any[] = pageData.results || pageData;
            pageList.forEach((e) => {
              if (e.department) deptSet.add(e.department);
            });
          }
        }
        setDepartments(Array.from(deptSet).sort());
      } catch { /* ignore */ }
    };
    fetchDepts();
  }, []);

  // Fetch attendance records — all filter params passed directly to avoid stale closures
  const fetchRecords = useCallback(async (m: number, y: number, status: string, dept: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { month: m, year: y };
      if (status) params.status = status;
      if (dept) params.department = dept;
      const { data } = await api.get('/attendance/all/', { params });
      setRecords(data.results || data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchRecords(month, year, statusFilter, departmentFilter);
  }, [month, year, statusFilter, departmentFilter, fetchRecords]);

  return (
    <div className="space-y-6 max-w-7xl">
      <h2 className="text-xl font-bold font-['Space_Grotesk']">All Attendance Records</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">All Status</option>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="HALF_DAY">Half Day</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>
        <select
          id="filter-department"
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
          }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Active filter indicator */}
        {(statusFilter || departmentFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setDepartmentFilter(''); }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-slate-500">
        {records.length} records shown
        {departmentFilter && <span className="text-cyan-400"> · Dept: {departmentFilter}</span>}
        {statusFilter && <span className="text-purple-400"> · Status: {statusFilter}</span>}
      </p>

      {/* Table */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">#</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Emp ID</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Employee</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Department</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Check In</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Check Out</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Hours</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              </td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-slate-500">No records found</td></tr>
            ) : records.map((r, idx) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                <td className="px-4 py-3 text-cyan-400 font-mono text-xs">EMP-{String(idx + 1).padStart(4, '0')}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{r.employee_name}</p>
                  <p className="text-xs text-slate-500">{r.employee_email}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{r.employee_department || '—'}</td>
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
