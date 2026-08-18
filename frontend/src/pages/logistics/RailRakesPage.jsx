import React, { useEffect, useState } from 'react';
import { TrainFront, PlusCircle, MapPin } from 'lucide-react';
import api from '../../api/client';
import { PageHeader, PageBody } from '../../components/layout/RouteHelpers';
import { EmptyState, Spinner, StatusBadge, Modal, Alert } from '../../components/ui/UIKit';

const RAKE_STATUSES = ['PLACED', 'LOADING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'UNLOADED'];

export default function RailRakesPage() {
  const [rakes, setRakes] = useState([]);
  const [stockyards, setStockyards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const [r, sy] = await Promise.all([api.get('/rakes'), api.get('/stockyards')]);
    setRakes(r.data.rakes);
    setStockyards(sy.data.stockyards);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    const { data } = await api.get(`/rakes/${id}`);
    setDetailItem(data.rake);
  };

  return (
    <>
      <PageHeader
        title="Rail Rake Tracker"
        subtitle="Live movement tracking for bulk rail rake dispatches"
        actions={<button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> Register Rake</button>}
      />
      <PageBody>
        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : rakes.length === 0 ? (
            <EmptyState icon={TrainFront} title="No rail rakes registered" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Rake No.</th><th className="px-2 py-2">Source</th><th className="px-2 py-2">Destination</th>
                    <th className="px-2 py-2">Wagons</th><th className="px-2 py-2">Loaded Qty</th><th className="px-2 py-2">Status</th><th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rakes.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-700">{r.rakeNumber}</td>
                      <td className="px-2 py-3">{r.sourceStockyard?.name}</td>
                      <td className="px-2 py-3 text-slate-500 flex items-center gap-1"><MapPin size={12} />{r.destination}</td>
                      <td className="px-2 py-3">{r.wagonCount}</td>
                      <td className="px-2 py-3">{r.loadedQuantityMT} MT</td>
                      <td className="px-2 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-2 py-3 text-right"><button className="text-coal-700 text-xs font-semibold" onClick={() => openDetail(r._id)}>Track →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Register Rail Rake">
        <RakeForm stockyards={stockyards} onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={`Rake ${detailItem?.rakeNumber || ''}`} wide>
        {detailItem && <RakeDetail rake={detailItem} onRefresh={async () => { const { data } = await api.get(`/rakes/${detailItem._id}`); setDetailItem(data.rake); load(); }} />}
      </Modal>
    </>
  );
}

function RakeForm({ stockyards, onDone }) {
  const [form, setForm] = useState({ rakeNumber: '', sourceStockyard: stockyards[0]?._id || '', destination: '', wagonCount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/rakes', { ...form, wagonCount: Number(form.wagonCount) });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register rake');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div><label className="label">Rake Number</label><input className="input" value={form.rakeNumber} onChange={update('rakeNumber')} placeholder="RK-58231" required /></div>
      <div><label className="label">Source Stockyard</label><select className="input" value={form.sourceStockyard} onChange={update('sourceStockyard')}>{stockyards.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
      <div><label className="label">Destination</label><input className="input" value={form.destination} onChange={update('destination')} placeholder="Consumer siding / station" required /></div>
      <div><label className="label">Wagon Count</label><input type="number" min="1" className="input" value={form.wagonCount} onChange={update('wagonCount')} required /></div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Registering…' : 'Register Rake'}</button>
    </form>
  );
}

function RakeDetail({ rake, onRefresh }) {
  const [status, setStatusVal] = useState('LOADING');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [loadedQuantityMT, setLoadedQuantityMT] = useState(rake.loadedQuantityMT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/rakes/${rake._id}/status`, { status, location, note, loadedQuantityMT: Number(loadedQuantityMT) });
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update rake status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{rake.sourceStockyard?.name} → {rake.destination}</p>
          <p className="text-xs text-slate-400">{rake.wagonCount} wagons · {rake.loadedQuantityMT} MT loaded</p>
        </div>
        <StatusBadge status={rake.status} />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Movement Timeline</p>
        <ol className="relative border-l border-slate-200 pl-5 space-y-4">
          {[...rake.events].reverse().map((ev, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-ember-600 ring-4 ring-orange-100" />
              <p className="text-sm font-semibold text-slate-700">{ev.status.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-400">{new Date(ev.timestamp).toLocaleString()} · {ev.location}</p>
              {ev.note && <p className="text-xs text-slate-500 mt-0.5">{ev.note}</p>}
            </li>
          ))}
        </ol>
      </div>

      {rake.status !== 'UNLOADED' && (
        <form onSubmit={submit} className="card p-4 space-y-3">
          {error && <Alert>{error}</Alert>}
          <p className="text-sm font-semibold text-slate-700">Log Movement Update</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">New Status</label><select className="input" value={status} onChange={(e) => setStatusVal(e.target.value)}>{RAKE_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}</select></div>
            <div><label className="label">Location</label><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} required /></div>
            <div><label className="label">Loaded Quantity (MT)</label><input type="number" min="0" className="input" value={loadedQuantityMT} onChange={(e) => setLoadedQuantityMT(e.target.value)} /></div>
            <div><label className="label">Note</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          </div>
          <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Logging…' : 'Log Update'}</button>
        </form>
      )}
    </div>
  );
}
