import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AccountProvider }       from './contexts/AccountContext'
import { CategoryProvider }      from './contexts/CategoryContext'
import { SelectedAccountProvider } from './contexts/SelectedAccountContext'

import AppLayout    from './components/layout/AppLayout'
import PrivateRoute  from './components/Auth/PrivateRoute'

import ProfilePage   from './pages/Profile'
import AccountsPage  from './pages/Accounts'
import IncomesPage   from './pages/Incomes'
import ExpensesPage  from './pages/Expenses'
import ReportsPage   from './pages/Reports'
import LoginForm     from './components/Auth/LoginForm'
import RegisterForm  from './components/Auth/RegisterForm'

// Componente para manejar redirección inicial
function RootRedirect() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-page__form">
          <h2 className="auth-page__title">Cargando...</h2>
        </div>
      </div>
    )
  }
  
  return user ? <Navigate to="/incomes" replace /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AccountProvider>
          <CategoryProvider>
            <SelectedAccountProvider>
              <Routes>
                <Route path="/" element={<RootRedirect />} />

                {/* Rutas públicas */}
                <Route 
                  path="/login" 
                  element={
                    <div className="auth-layout">
                      <LoginForm />
                    </div>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <div className="auth-layout">
                      <RegisterForm />
                    </div>
                  } 
                />

                {/* Rutas protegidas con layout */}
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <AppLayout>
                        <ProfilePage />
                      </AppLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <PrivateRoute>
                      <AppLayout>
                        <AccountsPage />
                      </AppLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/incomes"
                  element={
                    <PrivateRoute>
                      <AppLayout>
                        <IncomesPage />
                      </AppLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <PrivateRoute>
                      <AppLayout>
                        <ExpensesPage />
                      </AppLayout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PrivateRoute>
                      <AppLayout>
                        <ReportsPage />
                      </AppLayout>
                    </PrivateRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SelectedAccountProvider>
          </CategoryProvider>
        </AccountProvider>
      </AuthProvider>
    </Router>
  )
}