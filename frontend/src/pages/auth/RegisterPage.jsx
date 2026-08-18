import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mountain } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/UIKit';

const INDUSTRY_TYPES = ['POWER', 'STEEL', 'CEMENT', 'FERTILIZER', 'ALUMINIUM', 'OTHER'];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', companyName: '', industryType: 'POWER', gstin: '' });
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(form);
    if (res.success) navigate('/app/dashboard');
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-lg bg-ember-600 flex items-center justify-center"><Mountain size={20} className="text-white" /></div>
          <span className="font-bold text-slate-800 text-lg">Coal SCM Dashboard</span>
        </div>
        <div className="card p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Register as an Industrial Consumer</h1>
          <p className="text-sm text-slate-400 mb-6">Bid on e-auctions, track dispatches, and manage fuel supply agreements</p>
          {error && <div className="mb-4"><Alert>{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={update('name')} required />
            </div>
            <div>
              <label className="label">Company Name</label>
              <input className="input" value={form.companyName} onChange={update('companyName')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Industry Type</label>
                <select className="input" value={form.industryType} onChange={update('industryType')}>
                  {INDUSTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">GSTIN</label>
                <input className="input" value={form.gstin} onChange={update('gstin')} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={update('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" minLength={6} value={form.password} onChange={update('password')} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={update('phone')} />
            </div>
            <button className="btn-primary w-full py-2.5" disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
          </form>
          <p className="text-sm text-center text-slate-500 mt-5">Already have an account? <Link to="/login" className="text-coal-700 font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
