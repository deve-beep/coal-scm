import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Factory, PlusCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader, PageBody } from '../components/layout/RouteHelpers';
import { EmptyState, Spinner, Modal, Alert } from '../components/ui/UIKit';

const COMPANIES = ['ECL', 'BCCL', 'CCL', 'NCL', 'WCL', 'SECL', 'MCL', 'NEC', 'SCCL'];
const GRADES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CoalfieldsPage() {
  const { user } = useAuth();
  const [coalfields, setCoalfields] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(null);

  const load = async () => {
    setLoading(true);
    const [cf, summary] = await Promise.all([api.get('/coalfields'), api.get('/coalfields/production/national-summary')]);
    setCoalfields(cf.data.coalfields);
    setMonthly(summary.data.monthly.map((m) => ({ month: MONTH_NAMES[m._id - 1], target: m.totalTargetMT, actual: m.totalActualMT })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader
        title="Coalfields & Production"
        subtitle="National production targets vs. actuals, by coalfield and month"
        actions={user.role === 'admin' && <button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> New Coalfield</button>}
      />
      <PageBody>
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">National Production: Target vs. Actual ({new Date().getFullYear()})</h3>
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : monthly.length === 0 ? (
            <p className="text-sm text-slate-400">No production records yet for this year.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Million Tonnes', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" fill="#9aa3b0" name="Target (MT)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#ea580c" name="Actual (MT)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Coalfields</h3>
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : coalfields.length === 0 ? (
            <EmptyState icon={Factory} title="No coalfields registered" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Name</th><th className="px-2 py-2">Company</th><th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Grade</th><th className="px-2 py-2">Annual Target</th><th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {coalfields.map((cf) => (
                    <tr key={cf._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-medium text-slate-700">{cf.name}</td>
                      <td className="px-2 py-3"><span className="badge bg-coal-100 text-coal-700">{cf.company}</span></td>
                      <td className="px-2 py-3 text-slate-500">{cf.state}</td>
                      <td className="px-2 py-3 text-slate-500">{cf.grade}</td>
                      <td className="px-2 py-3">{cf.annualTargetMT} MT</td>
                      <td className="px-2 py-3 text-right">
                        {(user.role === 'admin' || user.role === 'logistics_manager') && (
                          <button className="text-coal-700 text-xs font-semibold" onClick={() => setRecordOpen(cf)}>Log Production →</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Coalfield">
        <CoalfieldForm onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>

      <Modal open={!!recordOpen} onClose={() => setRecordOpen(null)} title={`Log Production: ${recordOpen?.name || ''}`}>
        {recordOpen && <ProductionForm coalfieldId={recordOpen._id} onDone={() => { setRecordOpen(null); load(); }} />}
      </Modal>
    </>
  );
}

function CoalfieldForm({ onDone }) {
  const [form, setForm] = useState({ name: '', company: 'CCL', state: '', grade: 'G6', annualTargetMT: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/coalfields', { ...form, annualTargetMT: Number(form.annualTargetMT) });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create coalfield');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div>
        <label className="label">Name</label>
        <input className="input" value={form.name} onChange={update('name')} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Company</label>
          <select className="input" value={form.company} onChange={update('company')}>{COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div>
          <label className="label">Grade</label>
          <select className="input" value={form.grade} onChange={update('grade')}>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}</select>
        </div>
        <div>
          <label className="label">State</label>
          <input className="input" value={form.state} onChange={update('state')} required />
        </div>
        <div>
          <label className="label">Annual Target (MT)</label>
          <input type="number" min="0" className="input" value={form.annualTargetMT} onChange={update('annualTargetMT')} required />
        </div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Coalfield'}</button>
    </form>
  );
}

function ProductionForm({ coalfieldId, onDone }) {
  const now = new Date();
  const [form, setForm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1, targetMT: '', actualMT: '', dispatchedMT: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/coalfields/${coalfieldId}/production`, {
        ...form, year: Number(form.year), month: Number(form.month), targetMT: Number(form.targetMT),
        actualMT: Number(form.actualMT), dispatchedMT: Number(form.dispatchedMT) || 0,
      });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log production');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Year</label>
          <input type="number" className="input" value={form.year} onChange={update('year')} required />
        </div>
        <div>
          <label className="label">Month</label>
          <select className="input" value={form.month} onChange={update('month')}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Target (MT)</label>
          <input type="number" step="0.01" min="0" className="input" value={form.targetMT} onChange={update('targetMT')} required />
        </div>
        <div>
          <label className="label">Actual (MT)</label>
          <input type="number" step="0.01" min="0" className="input" value={form.actualMT} onChange={update('actualMT')} required />
        </div>
        <div className="col-span-2">
          <label className="label">Dispatched (MT)</label>
          <input type="number" step="0.01" min="0" className="input" value={form.dispatchedMT} onChange={update('dispatchedMT')} />
        </div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Saving…' : 'Log Production Record'}</button>
    </form>
  );
}
