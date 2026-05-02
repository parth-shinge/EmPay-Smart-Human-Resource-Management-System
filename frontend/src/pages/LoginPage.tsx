import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();

  const { login } = useAuth();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = 'Please enter a valid email address';
    if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-[#10131a] text-slate-200 font-['Inter']">
      {/* ─── LEFT: Branding & Glow ─── */}
      <div className="hidden md:flex md:w-1/2 relative bg-[#0b0e14] flex-col justify-center items-center overflow-hidden border-r border-white/5">
        {/* Abstract glow */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 mix-blend-screen pointer-events-none">
          <div className="absolute w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(76,215,246,0.15),transparent_60%)] rounded-full blur-[100px]" />
          {/* Tech grid */}
          <div className="absolute inset-0 tech-grid opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-md px-6">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-24 h-[1px] bg-cyan-500 mb-3 glow-line rounded-full" />
            <h1 className="font-['Inter'] text-[48px] font-bold text-white mb-1 tracking-tighter leading-[1.1]">
              EmPay
            </h1>
            <div className="font-['Space_Grotesk'] text-[12px] tracking-[0.15em] uppercase text-cyan-400 font-semibold">
              Management System
            </div>
          </div>

          <h2 className="font-['Inter'] text-2xl font-semibold text-white mb-4 leading-snug">
            HR & Payroll, Simplified.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            A sophisticated command center for modern organizations. Manage payroll, attendance, and organizational structure with clarity and precision.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end border-t border-white/5 pt-4 z-10">
          <span className="font-['Space_Grotesk'] text-[12px] text-slate-600 tracking-wide">SYS.VERSION: 4.2.1</span>
          <span className="font-['Space_Grotesk'] text-[12px] text-slate-600 tracking-wide">NODE: SECURE</span>
        </div>
      </div>

      {/* ─── RIGHT: Login Form ─── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-[#10131a] px-8 py-10 relative">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm space-y-6 relative z-10"
        >
          {/* Mobile branding */}
          <div className="md:hidden text-center mb-10">
            <h1 className="font-['Inter'] text-[48px] font-bold text-white tracking-tighter leading-[1.1]">EmPay</h1>
            <div className="font-['Space_Grotesk'] text-[12px] tracking-[0.15em] uppercase text-cyan-400 font-semibold">
              Management System
            </div>
          </div>

          {/* Welcome text */}
          <div className="text-left mb-8">
            <h2 className="font-['Inter'] text-[32px] font-semibold text-white mb-1 leading-tight">Welcome Back</h2>
            <p className="text-sm text-slate-400">Please authenticate to access the command center.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block font-['Inter'] text-[12px] tracking-[0.05em] uppercase text-slate-400 font-semibold"
              >
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={validate}
                  placeholder="admin@empay.corp"
                  className="w-full bg-[#0b0e14] border border-slate-700/60 rounded-md text-white text-base py-2.5 pl-10 pr-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-[#191c22] transition-all placeholder:text-slate-600"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="login-password"
                  className="block font-['Inter'] text-[12px] tracking-[0.05em] uppercase text-slate-400 font-semibold"
                >
                  Password
                </label>
                <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0e14] border border-slate-700/60 rounded-md text-white text-base py-2.5 pl-10 pr-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-[#191c22] transition-all placeholder:text-slate-600"
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-0.5">{errors.password}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-[#0b0e14] text-cyan-500 focus:ring-cyan-500 focus:ring-offset-[#10131a]"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-slate-400">
                Remember me
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-6 rounded-md bg-gradient-to-r from-cyan-500 to-teal-400 text-[#0c1324] font-['Inter'] text-[12px] tracking-[0.1em] uppercase font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:-translate-y-[1px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-[#10131a] disabled:opacity-60 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-white/5 bg-[#0b0e14]/50 rounded-lg p-4 backdrop-blur-md">
            <p className="font-['Inter'] text-[11px] tracking-[0.1em] uppercase text-slate-500 font-semibold mb-3 text-center">
              Demo Environment Access
            </p>
            <div className="grid grid-cols-1 gap-2 font-['Space_Grotesk'] text-sm text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-600">Admin:</span>
                <span className="text-cyan-400/80">admin@technova.com / Admin@123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">HR:</span>
                <span className="text-cyan-400/80">hr@technova.com / Officer@123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Payroll:</span>
                <span className="text-cyan-400/80">payroll@technova.com / Officer@123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Employee:</span>
                <span className="text-cyan-400/80">sneha@technova.com / Emp@12345</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
