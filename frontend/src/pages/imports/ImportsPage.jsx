import React, { useEffect, useState } from 'react';
import { Ship, PlusCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, PageBody } from '../../components/layout/RouteHelpers';
import { EmptyState, Spinner, StatusBadge, Modal, Alert, StatCard } from '../../components/ui/UIKit';

const SOURCE_COUNTRIES = ['Australia', 'Russia', 'USA', 'Indonesia', 'Canada', 'Mozambique', 'South Africa'];
const IMPORT_STATUSES = ['CONTRACTED', 'SHIPPED', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'CANCELLED'];

export default function ImportsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const calls = [api.get('/imports')];
    if (user.role !== 'consumer') calls.push(api.get('/imports/summary'), api.get('/users/consumers'));
    const results = await Promise.all(calls);
    setRecords(results[0].data.records);
    if (results[1]) setSummary(results[1].data.summary);
    if (results[2]) setConsumers(results[2].data.consumers);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => { await api.patch(`/imports/${id}`, { status }); load(); };

  return (
    <>
      <PageHeader
        title={user.role === 'consumer' ? 'My Coking Coal Imports' : 'Coking Coal Imports'}
        subtitle="Import contracts and coking coal dependency tracking for steel plants"
        actions={user.role !== 'consumer' && <button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> New Import Contract</button>}
      />
      <PageBody>
        {summary.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {summary.slice(0, 3).map((s) => (
              <StatCard key={s._id} label={s._id} value={`${s.totalQuantityMT.toFixed(1)} MT`} icon={Ship} accent="sky" sub={`${s.contractCount} contract(s) · $${(s.totalValueUSD / 1e6).toFixed(2)}M`} />
            ))}
          </div>
        )}

        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : records.length === 0 ? (
            <EmptyState icon={Ship} title="No import contracts found" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Contract No.</th><th className="px-2 py-2">Source</th><th className="px-2 py-2">Supplier</th>
                    <th className="px-2 py-2">Quantity</th><th className="px-2 py-2">Price (USD/t)</th><th className="px-2 py-2">Port</th><th className="px-2 py-2">Status</th><th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-700">{r.contractNumber}</td>
                      <td className="px-2 py-3">{r.sourceCountry}</td>
                      <td className="px-2 py-3 text-slate-500">{r.supplier}</td>
                      <td className="px-2 py-3">{r.quantityMT} MT</td>
                      <td className="px-2 py-3">${r.pricePerTonneUSD}</td>
                      <td className="px-2 py-3 text-slate-500">{r.portOfEntry}</td>
                      <td className="px-2 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-2 py-3 text-right">
                        {user.role !== 'consumer' && !['DELIVERED', 'CANCELLED'].includes(r.status) && (
                          <select className="input text-xs py-1 w-40 inline-block" value={r.status} onChange={(e) => setStatus(r._id, e.target.value)}>
                            {IMPORT_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                          </select>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Coking Coal Import Contract">
        <ImportForm consumers={consumers} onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>
    </>
  );
}

function ImportForm({ consumers, onDone }) {
  const [form, setForm] = useState({ consumer: consumers[0]?._id || '', sourceCountry: 'Australia', supplier: '', quantityMT: '', pricePerTonneUSD: '', portOfEntry: '', expectedArrival: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/imports', { ...form, quantityMT: Number(form.quantityMT), pricePerTonneUSD: Number(form.pricePerTonneUSD) });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create import contract');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div><label className="label">Consumer (Steel Plant)</label><select className="input" value={form.consumer} onChange={update('consumer')}>{consumers.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Source Country</label><select className="input" value={form.sourceCountry} onChange={update('sourceCountry')}>{SOURCE_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <div><label className="label">Supplier</label><input className="input" value={form.supplier} onChange={update('supplier')} required /></div>
        <div><label className="label">Quantity (MT)</label><input type="number" min="0.001" step="0.001" className="input" value={form.quantityMT} onChange={update('quantityMT')} required /></div>
        <div><label className="label">Price (USD/tonne)</label><input type="number" min="0" className="input" value={form.pricePerTonneUSD} onChange={update('pricePerTonneUSD')} required /></div>
        <div><label className="label">Port of Entry</label><input className="input" value={form.portOfEntry} onChange={update('portOfEntry')} required /></div>
        <div><label className="label">Expected Arrival</label><input type="date" className="input" value={form.expectedArrival} onChange={update('expectedArrival')} /></div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Contract'}</button>
    </form>
  );
}
