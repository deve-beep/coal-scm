import React, { useEffect, useState } from 'react';
import { Truck, PlusCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, PageBody } from '../../components/layout/RouteHelpers';
import { EmptyState, Spinner, StatusBadge, Modal, Alert } from '../../components/ui/UIKit';

const MODES = ['RAIL', 'ROAD', 'MGR', 'ROPEWAY', 'MERRY_GO_ROUND'];
const STATUSES = ['SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'];

export default function DispatchesPage() {
  const { user } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [stockyards, setStockyards] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const calls = [api.get('/dispatches')];
    if (user.role !== 'consumer') calls.push(api.get('/stockyards'), api.get('/users/consumers'));
    const results = await Promise.all(calls);
    setDispatches(results[0].data.dispatches);
    if (results[1]) setStockyards(results[1].data.stockyards);
    if (results[2]) setConsumers(results[2].data.consumers);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => { await api.patch(`/dispatches/${id}/status`, { status }); load(); };

  return (
    <>
      <PageHeader
        title={user.role === 'consumer' ? 'My Dispatches' : 'Bulk Dispatches'}
        subtitle="Coal dispatch tracking across rail, road and MGR modes"
        actions={user.role !== 'consumer' && <button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> New Dispatch</button>}
      />
      <PageBody>
        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : dispatches.length === 0 ? (
            <EmptyState icon={Truck} title="No dispatches found" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Dispatch ID</th><th className="px-2 py-2">Mode</th><th className="px-2 py-2">Source</th>
                    <th className="px-2 py-2">Consumer</th><th className="px-2 py-2">Quantity</th><th className="px-2 py-2">Status</th><th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {dispatches.map((d) => (
                    <tr key={d._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-700">{d.dispatchId}</td>
                      <td className="px-2 py-3 text-slate-500">{d.mode}</td>
                      <td className="px-2 py-3">{d.sourceStockyard?.name}</td>
                      <td className="px-2 py-3">{d.consumer?.companyName}</td>
                      <td className="px-2 py-3">{d.quantityMT} MT</td>
                      <td className="px-2 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-2 py-3 text-right">
                        {user.role !== 'consumer' && !['DELIVERED', 'CANCELLED'].includes(d.status) && (
                          <select className="input text-xs py-1 w-36 inline-block" value={d.status} onChange={(e) => setStatus(d._id, e.target.value)}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Dispatch">
        <DispatchForm stockyards={stockyards} consumers={consumers} onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>
    </>
  );
}

function DispatchForm({ stockyards, consumers, onDone }) {
  const [form, setForm] = useState({ mode: 'RAIL', sourceStockyard: stockyards[0]?._id || '', consumer: consumers[0]?._id || '', quantityMT: '', dispatchDate: new Date().toISOString().slice(0, 10), expectedDelivery: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/dispatches', { ...form, quantityMT: Number(form.quantityMT) });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dispatch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Mode</label>
          <select className="input" value={form.mode} onChange={update('mode')}>{MODES.map((m) => <option key={m} value={m}>{m.replaceAll('_', ' ')}</option>)}</select>
        </div>
        <div>
          <label className="label">Source Stockyard</label>
          <select className="input" value={form.sourceStockyard} onChange={update('sourceStockyard')}>{stockyards.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.currentStockMT} MT)</option>)}</select>
        </div>
        <div className="col-span-2">
          <label className="label">Consumer</label>
          <select className="input" value={form.consumer} onChange={update('consumer')}>{consumers.map((c) => <option key={c._id} value={c._id}>{c.companyName} ({c.industryType})</option>)}</select>
        </div>
        <div><label className="label">Quantity (MT)</label><input type="number" min="0.001" step="0.001" className="input" value={form.quantityMT} onChange={update('quantityMT')} required /></div>
        <div><label className="label">Dispatch Date</label><input type="date" className="input" value={form.dispatchDate} onChange={update('dispatchDate')} required /></div>
        <div className="col-span-2"><label className="label">Expected Delivery</label><input type="date" className="input" value={form.expectedDelivery} onChange={update('expectedDelivery')} /></div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Dispatch'}</button>
    </form>
  );
}
