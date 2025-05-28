import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AccountProvider }       from './contexts/AccountContext'

import Sidebar       from './components/layout/Sidebar'
import PrivateRoute  from './components/Auth/PrivateRoute'

import HomePage      from './pages/Home'
import ProfilePage   from './pages/Profile'
import AccountsPage  from './pages/Accounts'
import IncomesPage   from './pages/Incomes'
import ExpensesPage  from './pages/Expenses'
import ReportsPage   from './pages/Reports'
import LoginForm     from './components/Auth/LoginForm'
import RegisterForm  from './components/Auth/RegisterForm'

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user }   = useAuth()
  const { pathname } = useLocation()
  const publicPaths = ['/login', '/register']
  const isPublic = publicPaths.includes(pathname)

  return (
    <div className="app-layout">
      {!isPublic && user && <Sidebar />}
      <main className="app-content">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AccountProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* Públicas */}
              <Route path="/login"    element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />

              {/* Protegidas */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/accounts"
                element={
                  <PrivateRoute>
                    <AccountsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/incomes"
                element={
                  <PrivateRoute>
                    <IncomesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <PrivateRoute>
                    <ExpensesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <ReportsPage />
                  </PrivateRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </AccountProvider>
      </AuthProvider>
    </Router>
  )
}
