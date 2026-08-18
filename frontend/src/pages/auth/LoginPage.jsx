import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/UIKit';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@coalscm.gov.in', password: 'Admin@123' },
  { role: 'Logistics Mgr', email: 'logistics@coalscm.gov.in', password: 'Logistics@123' },
  { role: 'Consumer (Steel)', email: 'consumer@steelcorp.com', password: 'Consumer@123' },
  { role: 'Consumer (Power)', email: 'priya@powergrid-thermal.com', password: 'Consumer@123' },
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) navigate('/app/dashboard');
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-ember-600 flex items-center justify-center"><Mountain size={20} className="text-white" /></div>
          <span className="font-bold text-slate-800 text-lg">Coal SCM Dashboard</span>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-400 mb-6">Sign in to access your dashboard</p>
          {error && <div className="mb-4"><Alert>{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary w-full py-2.5" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
          <p className="text-sm text-center text-slate-500 mt-5">
            No account? <Link to="/register" className="text-coal-700 font-medium">Register as an industrial consumer</Link>
          </p>
        </div>

        <div className="card p-4 mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" onClick={() => { setEmail(a.email); setPassword(a.password); }} className="text-left border border-slate-200 rounded-lg px-3 py-2 hover:border-ember-400 hover:bg-orange-50 transition-colors">
                <p className="font-semibold text-slate-700">{a.role}</p>
                <p className="text-slate-400">{a.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
