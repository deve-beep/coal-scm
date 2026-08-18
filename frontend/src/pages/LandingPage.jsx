import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mountain, Gavel, Truck, Ship, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-ember-600 flex items-center justify-center"><Mountain size={18} className="text-white" /></div>
            <span className="font-bold text-slate-800">Coal Supply Chain & Distribution Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-outline">Sign In</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-coal-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge bg-coal-100 text-coal-700 mb-4">National Coal Monitoring Platform</span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
              Production targets to final delivery — tracked end to end.
            </h1>
            <p className="mt-5 text-slate-500 text-lg max-w-lg">
              A unified dashboard for monitoring national coal production against targets, stockyard levels,
              e-auctions, bulk dispatches, rail rake movements, fuel supply agreements, and coking coal imports.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/register" className="btn-primary px-6 py-3 text-base">Register as Consumer</Link>
              <Link to="/login" className="btn-outline px-6 py-3 text-base">Staff Sign In</Link>
            </div>
          </div>
          <div className="card p-6">
            <div className="h-64 rounded-xl bg-coal-100 flex flex-col items-center justify-center text-coal-600 gap-2">
              <Mountain size={40} />
              <p className="font-semibold text-sm">Real-time supply chain visibility</p>
              <p className="text-xs text-coal-500 px-8 text-center">Production, stock, logistics and imports — one platform, role-based access.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-4 gap-6">
        {[
          { icon: Gavel, title: 'E-Auctions', desc: 'Spot, linkage and forward e-auctions with live bidding and automated allotment to the highest bidder.' },
          { icon: Truck, title: 'Logistics Tracking', desc: 'Bulk dispatch records across rail, road and MGR modes, with live rail rake movement tracking.' },
          { icon: Ship, title: 'Import-Export', desc: 'Fuel supply agreements and coking coal import contracts, tracked from port of entry to delivery.' },
          { icon: AlertTriangle, title: 'Shortage Alerts', desc: 'Automated alerts when stockyard levels breach thresholds, plus consumer-reported shortage reports.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-6">
            <div className="h-10 w-10 rounded-lg bg-coal-50 text-coal-700 flex items-center justify-center mb-3"><Icon size={20} /></div>
            <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
            <p className="text-sm text-slate-500">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        Coal Supply Chain & Distribution Monitoring Dashboard — a demonstration full-stack MERN application.
      </footer>
    </div>
  );
}
