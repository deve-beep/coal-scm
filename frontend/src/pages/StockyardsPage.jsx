import React, { useEffect, useState } from 'react';
import { Warehouse, PlusCircle, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader, PageBody } from '../components/layout/RouteHelpers';
import { EmptyState, Spinner, Modal, Alert } from '../components/ui/UIKit';

const STOCK_STATUS_COLORS = { HEALTHY: 'bg-emerald-100 text-emerald-700', LOW: 'bg-amber-100 text-amber-700', CRITICAL: 'bg-rose-100 text-rose-700' };

export default function StockyardsPage() {
  const { user } = useAuth();
  const [stockyards, setStockyards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [coalfields, setCoalfields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [updateItem, setUpdateItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const [sy, sum, cf] = await Promise.all([api.get('/stockyards'), api.get('/stockyards/summary/national'), api.get('/coalfields')]);
    setStockyards(sy.data.stockyards);
    setSummary(sum.data.summary);
    setCoalfields(cf.data.coalfields);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader
        title="Stockyards"
        subtitle="National coal stock levels across depots"
        actions={user.role === 'admin' && <button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> New Stockyard</button>}
      />
      <PageBody>
        {summary && (
          <div className="grid sm:grid-cols-4 gap-4 mb-6">
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Total Stock</p><p className="text-2xl font-bold text-slate-800">{summary.totalStockMT} MT</p></div>
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Total Capacity</p><p className="text-2xl font-bold text-slate-800">{summary.totalCapacityMT} MT</p></div>
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Healthy</p><p className="text-2xl font-bold text-emerald-600">{summary.byStatus.HEALTHY || 0}</p></div>
            <div className="card p-4"><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Critical</p><p className="text-2xl font-bold text-rose-600">{summary.byStatus.CRITICAL || 0}</p></div>
          </div>
        )}

        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : stockyards.length === 0 ? (
            <EmptyState icon={Warehouse} title="No stockyards registered" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Name</th><th className="px-2 py-2">Coalfield</th><th className="px-2 py-2">Stock</th>
                    <th className="px-2 py-2">Capacity</th><th className="px-2 py-2">Status</th><th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {stockyards.map((s) => (
                    <tr key={s._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-medium text-slate-700">{s.name}</td>
                      <td className="px-2 py-3 text-slate-500">{s.coalfield?.name}</td>
                      <td className="px-2 py-3">
                        {s.currentStockMT} MT
                        <div className="h-1.5 rounded-full bg-slate-100 mt-1 w-32 overflow-hidden">
                          <div className={`h-full rounded-full ${s.stockStatus === 'CRITICAL' ? 'bg-rose-500' : s.stockStatus === 'LOW' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, s.fillPct)}%` }} />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-slate-400">{s.capacityMT} MT</td>
                      <td className="px-2 py-3"><span className={`badge ${STOCK_STATUS_COLORS[s.stockStatus]}`}>{s.stockStatus}{s.stockStatus === 'CRITICAL' && <AlertTriangle size={11} className="ml-1" />}</span></td>
                      <td className="px-2 py-3 text-right">
                        {(user.role === 'admin' || user.role === 'logistics_manager') && (
                          <button className="text-coal-700 text-xs font-semibold" onClick={() => setUpdateItem(s)}>Update Stock →</button>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Stockyard">
        <StockyardForm coalfields={coalfields} onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>

      <Modal open={!!updateItem} onClose={() => setUpdateItem(null)} title={`Update Stock: ${updateItem?.name || ''}`}>
        {updateItem && <UpdateStockForm item={updateItem} onDone={() => { setUpdateItem(null); load(); }} />}
      </Modal>
    </>
  );
}

function StockyardForm({ coalfields, onDone }) {
  const [form, setForm] = useState({ name: '', coalfield: coalfields[0]?._id || '', location: '', capacityMT: '', currentStockMT: '', minThresholdMT: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/stockyards', { ...form, capacityMT: Number(form.capacityMT), currentStockMT: Number(form.currentStockMT), minThresholdMT: Number(form.minThresholdMT) });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create stockyard');
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
      <div>
        <label className="label">Coalfield</label>
        <select className="input" value={form.coalfield} onChange={update('coalfield')}>{coalfields.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
      </div>
      <div>
        <label className="label">Location</label>
        <input className="input" value={form.location} onChange={update('location')} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="label">Capacity (MT)</label><input type="number" min="0" className="input" value={form.capacityMT} onChange={update('capacityMT')} required /></div>
        <div><label className="label">Current Stock (MT)</label><input type="number" min="0" className="input" value={form.currentStockMT} onChange={update('currentStockMT')} required /></div>
        <div><label className="label">Min Threshold (MT)</label><input type="number" min="0" className="input" value={form.minThresholdMT} onChange={update('minThresholdMT')} required /></div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Stockyard'}</button>
    </form>
  );
}

function UpdateStockForm({ item, onDone }) {
  const [currentStockMT, setCurrentStockMT] = useState(item.currentStockMT);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setAlertMsg('');
    try {
      const { data } = await api.patch(`/stockyards/${item._id}/stock`, { currentStockMT: Number(currentStockMT), note });
      if (data.alertRaised) setAlertMsg(`A shortage alert (${data.alertRaised.alertCode}) was automatically raised.`);
      setTimeout(onDone, alertMsg ? 1500 : 0);
      if (!data.alertRaised) onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {alertMsg && <Alert type="info">{alertMsg}</Alert>}
      <p className="text-sm text-slate-500">Minimum threshold: <strong>{item.minThresholdMT} MT</strong></p>
      <div>
        <label className="label">New Stock Level (MT)</label>
        <input type="number" min="0" className="input" value={currentStockMT} onChange={(e) => setCurrentStockMT(e.target.value)} required />
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Updating…' : 'Update Stock Level'}</button>
    </form>
  );
}
