/**
 * ProfilePage — User views & edits own profile.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { UserCircle, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', department: '', designation: '' });
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/profile/').then(({ data }) => {
      setProfile(data);
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        department: data.department || '',
        designation: data.designation || '',
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/profile/', form);
      toast.success('Profile updated!');
      refreshUser();
    } catch (err: any) {
      toast.error('Update failed');
    } finally { setSaving(false); }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    HR_OFFICER: 'HR Officer',
    PAYROLL_OFFICER: 'Payroll Officer',
    EMPLOYEE: 'Employee',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold font-['Space_Grotesk']">My Profile</h2>

      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-6">
        {/* Avatar + info */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-white/5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold">
            {profile.name?.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{profile.name}</h3>
            <p className="text-sm text-slate-400">{profile.email}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{roleLabels[profile.role]}</span>
              {profile.organization && (
                <span className="text-xs text-slate-500">{profile.organization.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Full Name</label>
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

        {/* Read-only info */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/5 text-sm">
          <div>
            <p className="text-xs text-slate-400">Email</p>
            <p className="mt-0.5 text-slate-300">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Date of Joining</p>
            <p className="mt-0.5 text-slate-300">{profile.date_of_joining || '—'}</p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 mt-6 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-sm font-medium transition-colors">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
