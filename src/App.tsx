import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FamiliesPage from './pages/FamiliesPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import ShoppingPage from './pages/ShoppingPage';
import PurchasesPage from './pages/PurchasesPage';
import BillsPage from './pages/BillsPage';
import GasPage from './pages/GasPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import ItemsPage from './pages/ItemsPage';
import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore(s => s.accessToken);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/families" element={<PrivateRoute><FamiliesPage /></PrivateRoute>} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/gas" element={<GasPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
