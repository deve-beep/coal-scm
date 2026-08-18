import React from 'react';

export function StatCard({ label, value, icon: Icon, accent = 'coal', sub }) {
  const accentMap = {
    coal: 'bg-coal-100 text-coal-700', amber: 'bg-amber-50 text-amber-700', emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700', violet: 'bg-violet-50 text-violet-700', sky: 'bg-sky-50 text-sky-700', ember: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      {Icon && <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${accentMap[accent]}`}><Icon size={22} /></div>}
    </div>
  );
}

const STATUS_COLORS = {
  UPCOMING: 'bg-slate-100 text-slate-700', LIVE: 'bg-emerald-100 text-emerald-700', CLOSED: 'bg-amber-100 text-amber-700',
  ALLOTTED: 'bg-sky-100 text-sky-700', CANCELLED: 'bg-rose-100 text-rose-700',
  SCHEDULED: 'bg-slate-100 text-slate-700', IN_TRANSIT: 'bg-amber-100 text-amber-700', DELIVERED: 'bg-emerald-100 text-emerald-700', DELAYED: 'bg-rose-100 text-rose-700',
  PLACED: 'bg-slate-100 text-slate-700', LOADING: 'bg-amber-100 text-amber-700', LOADED: 'bg-sky-100 text-sky-700', ARRIVED: 'bg-emerald-100 text-emerald-700', UNLOADED: 'bg-emerald-200 text-emerald-800',
  ACTIVE: 'bg-emerald-100 text-emerald-700', EXPIRED: 'bg-slate-100 text-slate-500', SUSPENDED: 'bg-amber-100 text-amber-700', TERMINATED: 'bg-rose-100 text-rose-700',
  CONTRACTED: 'bg-slate-100 text-slate-700', SHIPPED: 'bg-sky-100 text-sky-700', CUSTOMS_CLEARANCE: 'bg-amber-100 text-amber-700',
  OPEN: 'bg-rose-100 text-rose-700', ACKNOWLEDGED: 'bg-amber-100 text-amber-700', RESOLVED: 'bg-emerald-100 text-emerald-700', DISMISSED: 'bg-slate-100 text-slate-500',
};

const SEVERITY_COLORS = { LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-orange-100 text-orange-700', CRITICAL: 'bg-rose-100 text-rose-700' };

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'}`}>{status?.replaceAll('_', ' ')}</span>;
}
export function SeverityBadge({ severity }) {
  return <span className={`badge ${SEVERITY_COLORS[severity] || 'bg-slate-100 text-slate-600'}`}>{severity}</span>;
}
export function Spinner({ size = 20 }) {
  return <div className="animate-spin rounded-full border-2 border-slate-300 border-t-coal-700" style={{ width: size, height: size }} />;
}
export function EmptyState({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
      {Icon && <Icon size={40} className="mb-3 text-slate-300" />}
      <p className="font-semibold text-slate-500">{title}</p>
      {subtitle && <p className="text-sm mt-1 max-w-sm">{subtitle}</p>}
    </div>
  );
}
export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-panel w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
export function Alert({ type = 'error', children }) {
  const styles = { error: 'bg-rose-50 text-rose-700 border-rose-200', success: 'bg-emerald-50 text-emerald-700 border-emerald-200', info: 'bg-coal-50 text-coal-700 border-coal-200' };
  return <div className={`border rounded-lg px-4 py-2.5 text-sm ${styles[type]}`}>{children}</div>;
}
