/**
 * DashboardLayout — sidebar + topbar shell for all internal pages.
 * Responsive sidebar with role-aware navigation.
 */
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Clock, CalendarDays, Users, Wallet, DollarSign,
  FileText, UserCircle, Settings, LogOut, Menu, X, ChevronDown, Building2
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
  { label: 'Attendance', path: '/attendance', icon: <Clock size={18} />, roles: ['EMPLOYEE'] },
  { label: 'All Attendance', path: '/attendance/all', icon: <Clock size={18} />, roles: ['ADMIN', 'HR_OFFICER'] },
  { label: 'Apply Leave', path: '/leave/apply', icon: <CalendarDays size={18} />, roles: ['EMPLOYEE'] },
  { label: 'My Leaves', path: '/leave/my', icon: <CalendarDays size={18} />, roles: ['EMPLOYEE'] },
  { label: 'Manage Leaves', path: '/leave/manage', icon: <CalendarDays size={18} />, roles: ['ADMIN', 'PAYROLL_OFFICER'] },
  { label: 'Employees', path: '/employees', icon: <Users size={18} />, roles: ['ADMIN', 'HR_OFFICER'] },
  { label: 'Salary Structure', path: '/salary', icon: <Wallet size={18} />, roles: ['ADMIN', 'PAYROLL_OFFICER'] },
  { label: 'Payroll', path: '/payroll', icon: <DollarSign size={18} />, roles: ['ADMIN', 'PAYROLL_OFFICER'] },
  { label: 'My Payslips', path: '/payroll/payslips', icon: <FileText size={18} />, roles: ['EMPLOYEE'] },
  { label: 'Profile', path: '/profile', icon: <UserCircle size={18} />, roles: ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE'] },
  { label: 'Settings', path: '/settings', icon: <Settings size={18} />, roles: ['ADMIN'] },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  HR_OFFICER: 'HR Officer',
  PAYROLL_OFFICER: 'Payroll Officer',
  EMPLOYEE: 'Employee',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="flex h-screen bg-[#0c1324] text-white overflow-hidden">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] bg-[#0e1529] border-r border-white/5
        flex flex-col transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight font-['Space_Grotesk']">EMPAY</span>
          <button className="ml-auto lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => linkClass(isActive)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{roleLabels[user.role]}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0e1529]/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold font-['Space_Grotesk'] capitalize">
              {location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-400">{user.email}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
