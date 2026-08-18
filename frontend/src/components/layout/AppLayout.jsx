import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Factory, Warehouse, Gavel, Truck, TrainFront,
  FileText, Ship, AlertTriangle, Users, LogOut,
} from 'lucide-react';
import coalImage from "../../assets/coal.png";
import { useAuth } from '../../context/AuthContext';

const NAV_BY_ROLE = {
  admin: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/coalfields', label: 'Coalfields & Production', icon: Factory },
    { to: '/app/stockyards', label: 'Stockyards', icon: Warehouse },
    { to: '/app/auctions', label: 'E-Auctions', icon: Gavel },
    { to: '/app/dispatches', label: 'Dispatches', icon: Truck },
    { to: '/app/rakes', label: 'Rail Rake Tracker', icon: TrainFront },
    { to: '/app/fsa', label: 'Fuel Supply Agreements', icon: FileText },
    { to: '/app/imports', label: 'Coking Coal Imports', icon: Ship },
    { to: '/app/alerts', label: 'Shortage Alerts', icon: AlertTriangle },
    { to: '/app/users', label: 'Staff & Users', icon: Users },
  ],
  logistics_manager: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/coalfields', label: 'Coalfields & Production', icon: Factory },
    { to: '/app/stockyards', label: 'Stockyards', icon: Warehouse },
    { to: '/app/auctions', label: 'E-Auctions', icon: Gavel },
    { to: '/app/dispatches', label: 'Dispatches', icon: Truck },
    { to: '/app/rakes', label: 'Rail Rake Tracker', icon: TrainFront },
    { to: '/app/fsa', label: 'Fuel Supply Agreements', icon: FileText },
    { to: '/app/imports', label: 'Coking Coal Imports', icon: Ship },
    { to: '/app/alerts', label: 'Shortage Alerts', icon: AlertTriangle },
  ],
  consumer: [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/auctions', label: 'E-Auctions', icon: Gavel },
    { to: '/app/dispatches', label: 'My Dispatches', icon: Truck },
    { to: '/app/fsa', label: 'My Agreements', icon: FileText },
    { to: '/app/imports', label: 'My Imports', icon: Ship },
    { to: '/app/alerts', label: 'Shortage Alerts', icon: AlertTriangle },
  ],
};

const ROLE_LABEL = { admin: 'Ministry Administrator', logistics_manager: 'Logistics Manager', consumer: 'Industrial Consumer' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV_BY_ROLE[user?.role] || [];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 shrink-0 bg-coal-950 text-slate-200 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-coal-800">
          <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center">
    <img
        src={coalImage}
        alt="Coal"
        className="h-full w-full object-cover"
    />
</div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Coal SCM</p>
            <p className="text-[10px] text-coal-300 leading-tight">Supply Chain Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to} end={to === '/app/dashboard'}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-ember-600 text-white' : 'text-coal-200 hover:bg-coal-800 hover:text-white'}`}
            >
              <Icon size={17} />{label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-coal-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-coal-300">{ROLE_LABEL[user?.role]}</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-coal-200 hover:bg-coal-800 hover:text-white transition-colors">
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
