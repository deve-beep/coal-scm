import React, { useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import api from '../api/client';
import { PageHeader, PageBody } from '../components/layout/RouteHelpers';
import { EmptyState, Spinner, Modal, Alert } from '../components/ui/UIKit';

const ROLES = ['admin', 'logistics_manager', 'consumer'];
const REGIONS = ['Headquarters', 'Eastern Region', 'Western Region', 'Central Region', 'Southern Region'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/users', { params: roleFilter ? { role: roleFilter } : {} });
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { load(); }, [roleFilter]);

  const deactivate = async (id) => { if (!confirm('Deactivate this user?')) return; await api.delete(`/users/${id}`); load(); };

  return (
    <>
      <PageHeader
        title="Staff & Users"
        subtitle="Manage administrators, logistics managers and industrial consumer accounts"
        actions={<button className="btn-primary" onClick={() => setCreateOpen(true)}><UserPlus size={16} /> New Staff Account</button>}
      />
      <PageBody>
        <div className="card p-4 mb-6"><select className="input sm:w-56" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="">All roles</option>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>

        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : users.length === 0 ? (
            <EmptyState icon={Users} title="No users found" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide"><th className="px-2 py-2">Name</th><th className="px-2 py-2">Email</th><th className="px-2 py-2">Role</th><th className="px-2 py-2">Org / Region</th><th className="px-2 py-2">Status</th><th className="px-2 py-2"></th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-medium text-slate-700">{u.name}</td>
                      <td className="px-2 py-3 text-slate-500">{u.email}</td>
                      <td className="px-2 py-3"><span className="badge bg-coal-100 text-coal-700">{u.role}</span></td>
                      <td className="px-2 py-3 text-slate-500">{u.companyName || u.region || '—'}</td>
                      <td className="px-2 py-3"><span className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span></td>
                      <td className="px-2 py-3 text-right">{u.isActive && <button className="text-rose-600 text-xs font-semibold" onClick={() => deactivate(u._id)}>Deactivate</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Staff Account">
        <CreateUserForm onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>
    </>
  );
}

function CreateUserForm({ onDone }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'logistics_manager', phone: '', employeeId: '', region: 'Eastern Region' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users', form);
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={update('name')} required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={update('email')} required /></div>
        <div><label className="label">Password</label><input type="password" minLength={6} className="input" value={form.password} onChange={update('password')} required /></div>
        <div><label className="label">Role</label><select className="input" value={form.role} onChange={update('role')}>{ROLES.filter((r) => r !== 'consumer').map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
        <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={update('phone')} /></div>
        <div><label className="label">Employee ID</label><input className="input" value={form.employeeId} onChange={update('employeeId')} placeholder="LOG-0002" /></div>
        <div><label className="label">Region</label><select className="input" value={form.region} onChange={update('region')}>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Account'}</button>
    </form>
  );
}
