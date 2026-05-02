/**
 * RegisterPage — Public signup: create new org + admin user.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Building2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', organization_name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/', form);
      // Auto-login after registration
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        organization: data.organization,
      }));
      toast.success('Registration successful!');
      window.location.href = '/dashboard';
    } catch (err: any) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.password?.[0] || 'Registration failed';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0c1324] flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08),transparent_70%)]" />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-6">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-4">
            Start with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">EmPay</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Set up your organization and manage HR, attendance, leaves, and payroll — all in one place.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
              <Building2 size={20} className="text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Create Account</h2>
          <p className="text-sm text-slate-400 mb-6">Register your organization to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Organization Name</label>
              <input
                type="text"
                required
                value={form.organization_name}
                onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                placeholder="Acme Corp"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Your Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min 8 chars, at least 1 digit"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 text-sm font-semibold transition-all"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
