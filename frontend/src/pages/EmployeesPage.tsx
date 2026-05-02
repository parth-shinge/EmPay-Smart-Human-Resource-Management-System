/**
 * EmployeesPage — HR/Admin list + create employees.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Plus, Search, X } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  date_of_joining: string | null;
  is_active: boolean;
}

const roleColors: Record<string, string> = {
  ADMIN: 'text-red-400 bg-red-500/10',
  HR_OFFICER: 'text-blue-400 bg-blue-500/10',
  PAYROLL_OFFICER: 'text-purple-400 bg-purple-500/10',
  EMPLOYEE: 'text-cyan-400 bg-cyan-500/10',
};

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '', name: '', password: '', role: 'EMPLOYEE',
    department: '', designation: '', date_of_joining: '', phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      const { data } = await api.get('/employees/', { params });
      setEmployees(data.results || data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.department) delete (payload as any).department;
      if (!payload.designation) delete (payload as any).designation;
      if (!payload.date_of_joining) delete (payload as any).date_of_joining;
      if (!payload.phone) delete (payload as any).phone;
      await api.post('/employees/', payload);
      toast.success('Employee created!');
      setShowForm(false);
      setForm({ email: '', name: '', password: '', role: 'EMPLOYEE', department: '', designation: '', date_of_joining: '', phone: '' });
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || 'Creation failed';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-['Space_Grotesk']">Employees</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-sm font-medium transition-colors">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Employee'}
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500"
        />
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl bg-white/[0.03] border border-cyan-500/20 p-5 space-y-4">
          <h3 className="font-semibold text-cyan-400">Create New Employee</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Full Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500" />
            <input placeholder="Email *" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500" />
            <input placeholder="Password *" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white">
              <option value="EMPLOYEE">Employee</option>
              <option value="HR_OFFICER">HR Officer</option>
              <option value="PAYROLL_OFFICER">Payroll Officer</option>
            </select>
            <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500" />
            <input placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500" />
            <input type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
          </div>
          <button type="submit" disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-sm font-medium transition-colors">
            {submitting ? 'Creating...' : 'Create Employee'}
          </button>
        </form>
      )}

      {/* Employee List */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Department</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Designation</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Joined</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">No employees found</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${roleColors[emp.role]}`}>{emp.role}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">{emp.department || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{emp.designation || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{emp.date_of_joining || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${emp.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {emp.is_active ? 'Active' : 'Inactive'}
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
