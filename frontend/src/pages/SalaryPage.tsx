/**
 * SalaryPage — Payroll/Admin manage salary structures.
 */
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Wallet, Plus, X, Save } from 'lucide-react';

interface SalaryStructure {
  id: string;
  employee: string;
  employee_name: string;
  employee_email: string;
  basic_salary: string;
  hra: string;
  transport_allowance: string;
  other_allowances: string;
  pf_percentage: string;
  professional_tax: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

export default function SalaryPage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employee: '', basic_salary: '', hra: '', transport_allowance: '',
    other_allowances: '', pf_percentage: '12.00', professional_tax: '200.00',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [salRes, empRes] = await Promise.all([
        api.get('/salary/structure/'),
        api.get('/employees/'),
      ]);
      setStructures(salRes.data.results || salRes.data);
      setEmployees((empRes.data.results || empRes.data));
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ employee: '', basic_salary: '', hra: '', transport_allowance: '', other_allowances: '', pf_percentage: '12.00', professional_tax: '200.00' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        const { employee: _, ...updateData } = form;
        await api.patch(`/salary/structure/${editId}/`, updateData);
        toast.success('Salary structure updated!');
      } else {
        await api.post('/salary/structure/', form);
        toast.success('Salary structure created!');
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.employee?.[0] || err.response?.data?.detail || 'Failed';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  const handleEdit = (s: SalaryStructure) => {
    setForm({
      employee: s.employee,
      basic_salary: s.basic_salary,
      hra: s.hra,
      transport_allowance: s.transport_allowance,
      other_allowances: s.other_allowances,
      pf_percentage: s.pf_percentage,
      professional_tax: s.professional_tax,
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const gross = (s: SalaryStructure) =>
    (Number(s.basic_salary) + Number(s.hra) + Number(s.transport_allowance) + Number(s.other_allowances)).toLocaleString('en-IN');

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-['Space_Grotesk']">Salary Structures</h2>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-sm font-medium transition-colors">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Structure'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl bg-white/[0.03] border border-cyan-500/20 p-5 space-y-4">
          <h3 className="font-semibold text-cyan-400">{editId ? 'Edit' : 'Create'} Salary Structure</h3>
          {!editId && (
            <select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white">
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Basic Salary *</label>
              <input type="number" step="0.01" required value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">HRA</label>
              <input type="number" step="0.01" value={form.hra} onChange={(e) => setForm({ ...form, hra: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Transport</label>
              <input type="number" step="0.01" value={form.transport_allowance} onChange={(e) => setForm({ ...form, transport_allowance: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Other Allowances</label>
              <input type="number" step="0.01" value={form.other_allowances} onChange={(e) => setForm({ ...form, other_allowances: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">PF %</label>
              <input type="number" step="0.01" value={form.pf_percentage} onChange={(e) => setForm({ ...form, pf_percentage: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Prof. Tax</label>
              <input type="number" step="0.01" value={form.professional_tax} onChange={(e) => setForm({ ...form, professional_tax: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-sm font-medium transition-colors">
            <Save size={16} /> {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Employee</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Basic</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">HRA</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Transport</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Other</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">CTC</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">PF%</th>
              <th className="text-center px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : structures.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">No salary structures</td></tr>
            ) : structures.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{s.employee_name}</p>
                  <p className="text-xs text-slate-500">{s.employee_email}</p>
                </td>
                <td className="px-4 py-3 text-right text-slate-300">₹{Number(s.basic_salary).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-slate-300">₹{Number(s.hra).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-slate-300">₹{Number(s.transport_allowance).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-slate-300">₹{Number(s.other_allowances).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right font-semibold text-cyan-400">₹{gross(s)}</td>
                <td className="px-4 py-3 text-right text-slate-300">{s.pf_percentage}%</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleEdit(s)} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
