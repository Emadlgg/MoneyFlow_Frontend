import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Notifications from "./pages/Notifications";
import FinancialTips from "./pages/FinancialTips";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AccountProvider } from "./contexts/AccountContext";
import { SelectedAccountProvider } from "./contexts/SelectedAccountContext";

import Sidebar from "./components/layout/Sidebar";
import SpendingAlerts from "./components/SpendingAlerts";

import ProfilePage from "./pages/Profile";
import AccountsPage from "./pages/Accounts";
import IncomesPage from "./pages/Incomes";
import ExpensesPage from "./pages/Expenses";
import ReportsPage from "./pages/Reports";
import HomePage from "./pages/Home";
import Login from "./components/Auth/LoginForm";
import Register from "./components/Auth/RegisterForm";

import "./assets/style/layout.css";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar rutas públicas
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // Si hay usuario, mostrar aplicación completa
  return (
    <AccountProvider>
      <SelectedAccountProvider>
        <Router>
          <div className="app-layout">
            <Sidebar />
            <main className="app-layout__content">
              <Routes>
                <Route path="/" element={<Navigate to="/incomes" replace />} />
                <Route path="/home" element={<Navigate to="/incomes" replace />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/incomes" element={<IncomesPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/tips" element={<FinancialTips />} />
                <Route path="*" element={<Navigate to="/incomes" replace />} />
              </Routes>
            </main>
            <SpendingAlerts />
          </div>
        </Router>
      </SelectedAccountProvider>
    </AccountProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}