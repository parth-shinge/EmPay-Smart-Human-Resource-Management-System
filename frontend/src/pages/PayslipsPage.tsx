/**
 * PayslipsPage — Employee views own payslips. Admin/Payroll sees all.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface PayslipSummary {
  id: string;
  employee_name: string;
  employee_email: string;
  payrun_month: number;
  payrun_year: number;
  working_days: number;
  present_days: number;
  leave_days: number;
  gross_salary: string;
  total_deductions: string;
  net_salary: string;
  status: string;
}

interface PayslipDetail extends PayslipSummary {
  basic_salary: string;
  hra: string;
  transport_allowance: string;
  other_allowances: string;
  pf_deduction: string;
  professional_tax: string;
  other_deductions: string;
  payrun_status: string;
  employee_department: string;
}

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PayslipDetail | null>(null);

  useEffect(() => {
    api.get('/payroll/payslips/')
      .then(({ data }) => setPayslips(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  const toggleDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    try {
      const { data } = await api.get(`/payroll/payslips/${id}/`);
      setDetail(data);
      setExpandedId(id);
    } catch { /* ignore */ }
  };

  const fmt = (v: string | number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-xl font-bold font-['Space_Grotesk']">
        {user?.role === 'EMPLOYEE' ? 'My Payslips' : 'All Payslips'}
      </h2>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payslips.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p>No payslips available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payslips.map((ps) => (
            <div key={ps.id} className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
              <button
                onClick={() => toggleDetail(ps.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{MONTHS[ps.payrun_month]} {ps.payrun_year}</h3>
                    {user?.role !== 'EMPLOYEE' && (
                      <span className="text-xs text-slate-500">{ps.employee_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {ps.working_days} working days • {ps.present_days} present • {ps.leave_days} leave
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Net Salary</p>
                    <p className="text-lg font-bold text-cyan-400">{fmt(ps.net_salary)}</p>
                  </div>
                  {expandedId === ps.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {expandedId === ps.id && detail && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                    <div className="col-span-full mb-2">
                      <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Earnings</h4>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-400">Basic Salary</span><span>{fmt(detail.basic_salary)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">HRA</span><span>{fmt(detail.hra)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Transport</span><span>{fmt(detail.transport_allowance)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Other Allowances</span><span>{fmt(detail.other_allowances)}</span></div>
                    <div className="flex justify-between font-semibold text-cyan-400"><span>Gross Salary</span><span>{fmt(detail.gross_salary)}</span></div>

                    <div className="col-span-full mt-3 mb-2">
                      <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Deductions</h4>
                    </div>
                    <div className="flex justify-between"><span className="text-slate-400">PF Deduction</span><span className="text-red-400">{fmt(detail.pf_deduction)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Professional Tax</span><span className="text-red-400">{fmt(detail.professional_tax)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Other Deductions</span><span className="text-red-400">{fmt(detail.other_deductions)}</span></div>
                    <div className="flex justify-between font-semibold text-red-400"><span>Total Deductions</span><span>{fmt(detail.total_deductions)}</span></div>

                    <div className="col-span-full mt-3 pt-3 border-t border-white/5">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Salary</span>
                        <span className="text-cyan-400">{fmt(detail.net_salary)}</span>
                      </div>
                    </div>
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
