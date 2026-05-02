/**
 * EmployeeDetailPage — HR/Admin view & edit a single employee.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  date_of_joining: string | null;
  phone: string | null;
  is_active: boolean;
  organization: { id: string; name: string };
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', department: '', designation: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/employees/${id}/`)
      .then(({ data }) => {
        setEmployee(data);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          department: data.department || '',
          designation: data.designation || '',
        });
      })
      .catch(() => toast.error('Employee not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/employees/${id}/`, form);
      toast.success('Employee updated!');
      // refresh
      const { data } = await api.get(`/employees/${id}/`);
      setEmployee(data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}/`);
      toast.success('Employee deleted');
      navigate('/employees');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) return <p className="text-slate-500">Employee not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Employees
      </button>

      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{employee.name}</h2>
            <p className="text-sm text-slate-400">{employee.email}</p>
            <p className="text-xs text-slate-500 mt-0.5">{employee.role} • {employee.organization.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Designation</label>
            <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Date of Joining</p>
            <p className="mt-0.5">{employee.date_of_joining || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Status</p>
            <p className={`mt-0.5 ${employee.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
              {employee.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-sm font-medium transition-colors">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
