import React, { useEffect, useState } from 'react';
import { Gavel, PlusCircle, Trophy } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, PageBody } from '../../components/layout/RouteHelpers';
import { EmptyState, Spinner, StatusBadge, Modal, Alert } from '../../components/ui/UIKit';

const AUCTION_TYPES = ['SPOT', 'LINKAGE', 'FORWARD_E_AUCTION', 'SPECIAL_FORWARD'];
const STATUSES = ['UPCOMING', 'LIVE', 'CLOSED', 'ALLOTTED', 'CANCELLED'];

export default function AuctionsPage() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [coalfields, setCoalfields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    const [a, cf] = await Promise.all([api.get('/auctions', { params }), api.get('/coalfields')]);
    setAuctions(a.data.auctions);
    setCoalfields(cf.data.coalfields);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openDetail = async (id) => {
    const { data } = await api.get(`/auctions/${id}`);
    setDetailItem(data.auction);
  };

  return (
    <>
      <PageHeader
        title="E-Auctions"
        subtitle="Spot, linkage and forward e-auctions"
        actions={user.role === 'admin' && <button className="btn-primary" onClick={() => setCreateOpen(true)}><PlusCircle size={16} /> New Auction</button>}
      />
      <PageBody>
        <div className="card p-4 mb-6">
          <select className="input sm:w-56" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </select>
        </div>

        <div className="card p-6">
          {loading ? <div className="py-16 flex justify-center"><Spinner size={28} /></div> : auctions.length === 0 ? (
            <EmptyState icon={Gavel} title="No auctions found" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                    <th className="px-2 py-2">Auction Code</th><th className="px-2 py-2">Coalfield</th><th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Lot Size</th><th className="px-2 py-2">Reserve Price</th><th className="px-2 py-2">Bids</th>
                    <th className="px-2 py-2">Status</th><th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map((a) => (
                    <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-700">{a.auctionCode}</td>
                      <td className="px-2 py-3">{a.coalfield?.name}</td>
                      <td className="px-2 py-3 text-slate-500 text-xs">{a.type.replaceAll('_', ' ')}</td>
                      <td className="px-2 py-3">{a.quantityMT} MT</td>
                      <td className="px-2 py-3">₹{a.reservePricePerTonne}/t</td>
                      <td className="px-2 py-3">{a.bids?.length || 0}</td>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Auction">
        <AuctionForm coalfields={coalfields} onDone={() => { setCreateOpen(false); load(); }} />
      </Modal>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Auction Details" wide>
        {detailItem && <AuctionDetail auction={detailItem} onRefresh={async () => { const { data } = await api.get(`/auctions/${detailItem._id}`); setDetailItem(data.auction); load(); }} />}
      </Modal>
    </>
  );
}

function AuctionForm({ coalfields, onDone }) {
  const [form, setForm] = useState({ type: 'SPOT', coalfield: coalfields[0]?._id || '', quantityMT: '', reservePricePerTonne: '', startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auctions', { ...form, quantityMT: Number(form.quantityMT), reservePricePerTonne: Number(form.reservePricePerTonne) });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={update('type')}>{AUCTION_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</select>
        </div>
        <div>
          <label className="label">Coalfield</label>
          <select className="input" value={form.coalfield} onChange={update('coalfield')}>{coalfields.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
        </div>
        <div><label className="label">Lot Size (MT)</label><input type="number" min="1" className="input" value={form.quantityMT} onChange={update('quantityMT')} required /></div>
        <div><label className="label">Reserve Price (₹/tonne)</label><input type="number" min="0" className="input" value={form.reservePricePerTonne} onChange={update('reservePricePerTonne')} required /></div>
        <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={update('startDate')} required /></div>
        <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={update('endDate')} required /></div>
      </div>
      <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Creating…' : 'Create Auction'}</button>
    </form>
  );
}

function AuctionDetail({ auction, onRefresh }) {
  const { user } = useAuth();
  const [bidQty, setBidQty] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setStatus = async (status) => { await api.patch(`/auctions/${auction._id}/status`, { status }); onRefresh(); };
  const allot = async () => { await api.post(`/auctions/${auction._id}/allot`); onRefresh(); };

  const placeBid = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/auctions/${auction._id}/bid`, { quantityMT: Number(bidQty), pricePerTonne: Number(bidPrice) });
      setBidQty(''); setBidPrice('');
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-mono font-semibold text-slate-700">{auction.auctionCode}</p>
          <p className="text-sm text-slate-500">{auction.coalfield?.name} · {auction.type.replaceAll('_', ' ')} · {auction.quantityMT} MT · Reserve ₹{auction.reservePricePerTonne}/t</p>
        </div>
        <StatusBadge status={auction.status} />
      </div>

      {user.role === 'admin' && (
        <div className="flex gap-2 flex-wrap">
          {auction.status === 'UPCOMING' && <button className="btn-outline text-xs" onClick={() => setStatus('LIVE')}>Open Bidding (Set Live)</button>}
          {auction.status === 'LIVE' && <button className="btn-outline text-xs" onClick={() => setStatus('CLOSED')}>Close Bidding</button>}
          {['CLOSED', 'LIVE'].includes(auction.status) && auction.bids?.length > 0 && <button className="btn-ember text-xs" onClick={allot}><Trophy size={14} /> Allot to Highest Bidder</button>}
          {['UPCOMING', 'LIVE'].includes(auction.status) && <button className="btn-danger text-xs" onClick={() => setStatus('CANCELLED')}>Cancel Auction</button>}
        </div>
      )}

      {user.role === 'consumer' && auction.status === 'LIVE' && (
        <form onSubmit={placeBid} className="card p-4 space-y-3">
          {error && <Alert>{error}</Alert>}
          <p className="text-sm font-semibold text-slate-700">Place a Bid</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Quantity (MT, max {auction.quantityMT})</label><input type="number" min="1" max={auction.quantityMT} className="input" value={bidQty} onChange={(e) => setBidQty(e.target.value)} required /></div>
            <div><label className="label">Price (₹/tonne, min {auction.reservePricePerTonne})</label><input type="number" min={auction.reservePricePerTonne} className="input" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} required /></div>
          </div>
          <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Placing bid…' : 'Place Bid'}</button>
        </form>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Bids ({auction.bids?.length || 0})</p>
        {auction.bids?.length === 0 ? <p className="text-sm text-slate-400">No bids placed yet.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs uppercase"><th className="py-1">Bidder</th><th>Quantity</th><th>Price</th><th>Placed</th></tr></thead>
            <tbody>
              {[...(auction.bids || [])].sort((a, b) => b.pricePerTonne - a.pricePerTonne).map((b) => (
                <tr key={b._id} className={`border-t border-slate-100 ${auction.winningBid === b._id ? 'bg-emerald-50' : ''}`}>
                  <td className="py-2">{b.bidder?.companyName || b.bidder?.name} {auction.winningBid === b._id && <span className="badge bg-emerald-100 text-emerald-700 ml-1">Winner</span>}</td>
                  <td className="py-2">{b.quantityMT} MT</td>
                  <td className="py-2 font-semibold">₹{b.pricePerTonne}/t</td>
                  <td className="py-2 text-xs text-slate-400">{new Date(b.placedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
