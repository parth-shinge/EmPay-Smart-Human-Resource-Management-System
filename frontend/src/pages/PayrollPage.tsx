/**
 * PayrollPage — Payroll/Admin manage payruns (create, process, finalize).
 */
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { DollarSign, Play, CheckCircle, Plus } from 'lucide-react';

interface Payrun {
  id: string;
  month: number;
  year: number;
  status: string;
  created_by_name: string | null;
  created_at: string;
  processed_at: string | null;
  payslip_count: number;
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusStyles: Record<string, string> = {
  DRAFT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  PROCESSED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  FINALIZED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function PayrollPage() {
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayruns = async () => {
    try {
      const { data } = await api.get('/payroll/payruns/');
      setPayruns(data.results || data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayruns(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post('/payroll/payruns/', { month, year });
      toast.success('Payrun created!');
      setShowCreate(false);
      fetchPayruns();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Creation failed');
    } finally { setCreating(false); }
  };

  const handleProcess = async (id: string) => {
    setProcessing(id);
    try {
      const { data } = await api.post(`/payroll/payruns/${id}/process/`);
      toast.success(`Processed! ${data.payslips_generated} payslips generated.`);
      fetchPayruns();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Processing failed');
    } finally { setProcessing(null); }
  };

  const handleFinalize = async (id: string) => {
    try {
      await api.post(`/payroll/payruns/${id}/finalize/`);
      toast.success('Payrun finalized! Payslips are now visible to employees.');
      fetchPayruns();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Finalization failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-['Space_Grotesk']">Payroll Management</h2>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-sm font-medium transition-colors">
          <Plus size={16} /> New Payrun
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl bg-white/[0.03] border border-cyan-500/20 p-5 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{MONTHS[i + 1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white">
              {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={creating}
            className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-sm font-medium transition-colors">
            {creating ? 'Creating...' : 'Create Draft'}
          </button>
        </div>
      )}

      {/* Payrun cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payruns.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <DollarSign size={40} className="mx-auto mb-3 opacity-40" />
          <p>No payruns yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payruns.map((pr) => (
            <div key={pr.id} className="rounded-xl bg-white/[0.03] border border-white/5 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{MONTHS[pr.month]} {pr.year}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusStyles[pr.status]}`}>
                      {pr.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {pr.payslip_count} payslips • Created by {pr.created_by_name || 'System'}
                  </p>
                  {pr.processed_at && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Processed: {new Date(pr.processed_at).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pr.status === 'DRAFT' && (
                    <button onClick={() => handleProcess(pr.id)} disabled={processing === pr.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm font-medium transition-colors disabled:opacity-50">
                      <Play size={14} /> {processing === pr.id ? 'Processing...' : 'Process'}
                    </button>
                  )}
                  {pr.status === 'PROCESSED' && (
                    <button onClick={() => handleFinalize(pr.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium transition-colors">
                      <CheckCircle size={14} /> Finalize
                    </button>
                  )}
                  {pr.status === 'FINALIZED' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={14} /> Complete</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
