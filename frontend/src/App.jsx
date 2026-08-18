import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/RouteHelpers';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CoalfieldsPage from './pages/CoalfieldsPage';
import StockyardsPage from './pages/StockyardsPage';
import AuctionsPage from './pages/auctions/AuctionsPage';
import DispatchesPage from './pages/logistics/DispatchesPage';
import RailRakesPage from './pages/logistics/RailRakesPage';
import FsaPage from './pages/FsaPage';
import ImportsPage from './pages/imports/ImportsPage';
import AlertsPage from './pages/AlertsPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="coalfields" element={<ProtectedRoute roles={['admin', 'logistics_manager']}><CoalfieldsPage /></ProtectedRoute>} />
            <Route path="stockyards" element={<ProtectedRoute roles={['admin', 'logistics_manager']}><StockyardsPage /></ProtectedRoute>} />
            <Route path="auctions" element={<AuctionsPage />} />
            <Route path="dispatches" element={<DispatchesPage />} />
            <Route path="rakes" element={<ProtectedRoute roles={['admin', 'logistics_manager']}><RailRakesPage /></ProtectedRoute>} />
            <Route path="fsa" element={<FsaPage />} />
            <Route path="imports" element={<ImportsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
