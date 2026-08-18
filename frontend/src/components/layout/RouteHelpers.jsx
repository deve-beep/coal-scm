import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app/dashboard" replace />;
  return children;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="min-h-16 border-b border-slate-200 bg-white px-8 py-3 flex items-center justify-between sticky top-0 z-10 gap-4 flex-wrap">
      <div>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

export function PageBody({ children }) {
  return <div className="p-8 max-w-7xl">{children}</div>;
}
