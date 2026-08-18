import React, { useEffect, useState } from 'react';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader, PageBody } from '../components/layout/RouteHelpers';
import { EmptyState, Spinner, StatusBadge, SeverityBadge, Modal, Alert } from '../components/ui/UIKit';

const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [stockyards, setStockyards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const calls = [api.get('/alerts')];
    if (user.role !== 'consumer') calls.push(api.get('/stockyards'));
    const results = await Promise.all(calls);
    setAlerts(results[0].data.alerts);
    if (results[1]) setStockyards(results[1].data.stockyards);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => { const { data } = await api.get(`/alerts/${id}`); setDetailItem(data.alert); };

  return (
    <>
      <PageHeader
        title="Shortage Alerts"
        subtitle="Stock threshold alerts and consumer-reported shortages"
        actions={<button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> Report Shortage</button>}
      />
      <PageBody>
        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : alerts.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No alerts" subtitle="No shortage alerts have been raised." />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Alert Code</th><th className="px-2 py-2">Title</th><th className="px-2 py-2">Source</th>
                    <th className="px-2 py-2">Severity</th><th className="px-2 py-2">Status</th><th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-700">{a.alertCode}</td>
                      <td className="px-2 py-3 max-w-xs truncate">{a.title}</td>
                      <td className="px-2 py-3 text-xs text-slate-500">{a.source.replaceAll('_', ' ')}</td>
                      <td className="px-2 py-3"><SeverityBadge severity={a.severity} /></td>
                      <td className="px-2 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-2 py-3 text-right"><button className="text-coal-700 text-xs font-semibold" onClick={() => openDetail(a._id)}>Details →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Report a Shortage">
        <RaiseAlertForm stockyards={stockyards} onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.alertCode || ''}>
        {detailItem && <AlertDetail alert={detailItem} onRefresh={async () => { const { data } = await api.get(`/alerts/${detailItem._id}`); setDetailItem(data.alert); load(); }} />}
      </Modal>
    </>
  );
}

function RaiseAlertForm({ stockyards, onDone }) {
  const [form, setForm] = useState({ stockyard: stockyards[0]?._id || '', title: '', description: '', severity: 'MEDIUM' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.stockyard) delete payload.stockyard;
      await api.post('/alerts', payload);
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to report shortage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {stockyards.length > 0 && (
        <div><label className="label">Related Stockyard (optional)</label><select className="input" value={form.stockyard} onChange={update('stockyard')}><option value="">— None —</option>{stockyards.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
      )}
      <div><label className="label">Title</label><input className="input" value={form.title} onChange={update('title')} required /></div>
      <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={update('description')} required /></div>
      <div><label className="label">Severity</label><select className="input" value={form.severity} onChange={update('severity')}>{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Submitting…' : 'Report Shortage'}</button>
    </form>
  );
}

function AlertDetail({ alert, onRefresh }) {
  const { user } = useAuth();
  const canManage = ['admin', 'logistics_manager'].includes(user.role);
  const [status, setStatusVal] = useState('ACKNOWLEDGED');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/alerts/${alert._id}/status`, { status, note });
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><SeverityBadge severity={alert.severity} /></div>
        <StatusBadge status={alert.status} />
      </div>
      <p className="text-sm text-slate-600">{alert.description}</p>
      {alert.stockyard && <p className="text-xs text-slate-400">Stockyard: {alert.stockyard.name} ({alert.stockyard.currentStockMT} MT / min {alert.stockyard.minThresholdMT} MT)</p>}

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Update History</p>
        <ol className="relative border-l border-slate-200 pl-5 space-y-3">
          {[...alert.updates].reverse().map((u, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />
              <p className="text-sm font-semibold text-slate-700">{u.status.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-400">{new Date(u.timestamp).toLocaleString()}</p>
              {u.note && <p className="text-xs text-slate-500">{u.note}</p>}
            </li>
          ))}
        </ol>
      </div>

      {canManage && alert.status !== 'RESOLVED' && (
        <form onSubmit={submit} className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Update Status</p>
          <select className="input" value={status} onChange={(e) => setStatusVal(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <input className="input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Updating…' : 'Update Status'}</button>
        </form>
      )}
    </div>
  );
}
