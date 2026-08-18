import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Factory, Warehouse, Gavel, Truck, TrainFront, AlertTriangle, Users, PlusCircle, FileText } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PageHeader, PageBody } from '../components/layout/RouteHelpers';
import { StatCard, StatusBadge, Spinner, EmptyState } from '../components/ui/UIKit';

const COLORS = ['#374151', '#ea580c', '#0ea5e9', '#10b981', '#a855f7', '#f43f5e'];

export default function DashboardPage() {
  const { user } = useAuth();
  if (user.role === 'admin' || user.role === 'logistics_manager') return <StaffDashboard />;
  return <ConsumerDashboard />;
}

function StaffDashboard() {
  const [summary, setSummary] = useState(null);
  const [auctionBreakdown, setAuctionBreakdown] = useState([]);
  const [dispatchBreakdown, setDispatchBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, ab, db] = await Promise.all([
        api.get('/dashboard/summary'), api.get('/dashboard/auction-status-breakdown'), api.get('/dashboard/dispatch-mode-breakdown'),
      ]);
      setSummary(s.data.summary);
      setAuctionBreakdown(ab.data.breakdown.map((b) => ({ name: b._id, value: b.count })));
      setDispatchBreakdown(db.data.breakdown.map((b) => ({ name: b._id, count: b.count, quantity: b.totalQuantityMT })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <CenteredSpinner />;
  const achievementPct = summary.totalTargetMT > 0 ? Math.round((summary.totalActualMT / summary.totalTargetMT) * 100) : 0;

  return (
    <>
      <PageHeader title="National Coal SCM Dashboard" subtitle="Real-time production, stock and logistics overview" />
      <PageBody>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Production (YTD)" value={`${summary.totalActualMT.toFixed(1)} MT`} icon={Factory} accent="coal" sub={`${achievementPct}% of ${summary.totalTargetMT.toFixed(1)} MT target`} />
          <StatCard label="Total Stock" value={`${summary.totalStockMT} MT`} icon={Warehouse} accent="sky" sub={`${summary.criticalStockyards} critical stockyard(s)`} />
          <StatCard label="Live Auctions" value={summary.liveAuctions} icon={Gavel} accent="ember" />
          <StatCard label="Rakes In Transit" value={summary.rakesInTransit} icon={TrainFront} accent="amber" sub={`${summary.activeDispatches} active dispatches`} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <StatCard label="Open Shortage Alerts" value={summary.openAlerts} icon={AlertTriangle} accent="rose" />
          <StatCard label="Active Consumers" value={summary.activeConsumers} icon={Users} accent="violet" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">E-Auction Status</h3>
            {auctionBreakdown.length === 0 ? <p className="text-sm text-slate-400">No auctions yet.</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={auctionBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                    {auctionBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Dispatches by Mode</h3>
            {dispatchBreakdown.length === 0 ? <p className="text-sm text-slate-400">No dispatches yet.</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dispatchBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#374151" name="Dispatch Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}

function ConsumerDashboard() {
  const { user } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [fsa, setFsa] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [d, f, a] = await Promise.all([api.get('/dispatches?limit=5'), api.get('/fsa'), api.get('/alerts')]);
      setDispatches(d.data.dispatches);
      setFsa(f.data.agreements);
      setAlerts(a.data.alerts);
      setLoading(false);
    })();
  }, []);

  if (loading) return <CenteredSpinner />;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.companyName}`}
        subtitle="Your supply chain overview"
        actions={<Link to="/app/auctions" className="btn-primary"><Gavel size={16} /> Browse E-Auctions</Link>}
      />
      <PageBody>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Active Agreements" value={fsa.filter((f) => f.status === 'ACTIVE').length} icon={FileText} accent="coal" />
          <StatCard label="Recent Dispatches" value={dispatches.length} icon={Truck} accent="sky" />
          <StatCard label="My Open Alerts" value={alerts.filter((a) => a.status !== 'RESOLVED').length} icon={AlertTriangle} accent="rose" />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Recent Dispatches</h3>
            <Link to="/app/dispatches" className="text-sm text-coal-700 font-medium">View all →</Link>
          </div>
          {dispatches.length === 0 ? <EmptyState icon={Truck} title="No dispatches yet" /> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 text-xs uppercase"><th className="py-2">Dispatch ID</th><th>Mode</th><th>Quantity</th><th>Status</th></tr></thead>
              <tbody>
                {dispatches.map((d) => (
                  <tr key={d._id} className="border-t border-slate-100">
                    <td className="py-2 font-mono text-xs font-semibold">{d.dispatchId}</td>
                    <td className="py-2">{d.mode}</td>
                    <td className="py-2">{d.quantityMT} MT</td>
                    <td className="py-2"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageBody>
    </>
  );
}

function CenteredSpinner() {
  return <div className="h-screen flex items-center justify-center"><Spinner size={32} /></div>;
}
