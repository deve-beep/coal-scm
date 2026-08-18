import React, { useEffect, useState } from 'react';
import { FileText, PlusCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader, PageBody } from '../components/layout/RouteHelpers';
import { EmptyState, Spinner, StatusBadge, Modal, Alert } from '../components/ui/UIKit';

const STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'TERMINATED'];

export default function FsaPage() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [coalfields, setCoalfields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const calls = [api.get('/fsa')];
    if (user.role === 'admin') calls.push(api.get('/users/consumers'), api.get('/coalfields'));
    const results = await Promise.all(calls);
    setAgreements(results[0].data.agreements);
    if (results[1]) setConsumers(results[1].data.consumers);
    if (results[2]) setCoalfields(results[2].data.coalfields);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader
        title={user.role === 'consumer' ? 'My Fuel Supply Agreements' : 'Fuel Supply Agreements'}
        subtitle="FSA contracts between coalfields and industrial consumers"
        actions={user.role === 'admin' && <button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> New Agreement</button>}
      />
      <PageBody>
        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : agreements.length === 0 ? (
            <EmptyState icon={FileText} title="No agreements found" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Agreement No.</th>
                    {user.role !== 'consumer' && <th className="px-2 py-2">Consumer</th>}
                    <th className="px-2 py-2">Coalfield</th><th className="px-2 py-2">Contracted Qty</th>
                    <th className="px-2 py-2">Fulfillment</th><th className="px-2 py-2">Valid Until</th><th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map((f) => (
                    <tr key={f._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-700">{f.agreementNumber}</td>
                      {user.role !== 'consumer' && <td className="px-2 py-3">{f.consumer?.companyName}</td>}
                      <td className="px-2 py-3">{f.coalfield?.name}</td>
                      <td className="px-2 py-3">{f.annualContractedQuantityMT} MT</td>
                      <td className="px-2 py-3">
                        {f.suppliedToDateMT} / {f.annualContractedQuantityMT} MT
                        <div className="h-1.5 rounded-full bg-slate-100 mt-1 w-32 overflow-hidden"><div className="h-full rounded-full bg-coal-600" style={{ width: `${Math.min(100, f.fulfillmentPct)}%` }} /></div>
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-400">{new Date(f.validTo).toLocaleDateString()}</td>
                      <td className="px-2 py-3"><StatusBadge status={f.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Fuel Supply Agreement">
        <FsaForm consumers={consumers} coalfields={coalfields} onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>
    </>
  );
}

function FsaForm({ consumers, coalfields, onDone }) {
  const [form, setForm] = useState({ consumer: consumers[0]?._id || '', coalfield: coalfields[0]?._id || '', annualContractedQuantityMT: '', pricePerTonne: '', validFrom: '', validTo: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/fsa', { ...form, annualContractedQuantityMT: Number(form.annualContractedQuantityMT), pricePerTonne: Number(form.pricePerTonne) });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create agreement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div><label className="label">Consumer</label><select className="input" value={form.consumer} onChange={update('consumer')}>{consumers.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}</select></div>
      <div><label className="label">Coalfield</label><select className="input" value={form.coalfield} onChange={update('coalfield')}>{coalfields.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Annual Qty (MT)</label><input type="number" min="0" className="input" value={form.annualContractedQuantityMT} onChange={update('annualContractedQuantityMT')} required /></div>
        <div><label className="label">Price (₹/tonne)</label><input type="number" min="0" className="input" value={form.pricePerTonne} onChange={update('pricePerTonne')} required /></div>
        <div><label className="label">Valid From</label><input type="date" className="input" value={form.validFrom} onChange={update('validFrom')} required /></div>
        <div><label className="label">Valid To</label><input type="date" className="input" value={form.validTo} onChange={update('validTo')} required /></div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Agreement'}</button>
    </form>
  );
}
