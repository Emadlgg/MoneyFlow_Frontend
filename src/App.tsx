// src/App.tsx
import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/Home'
import TransactionsPage from './pages/Transactions'
import RegisterForm from './components/Auth/RegisterForm'
import LoginForm from './components/Auth/LoginForm'
import PrivateRoute from './components/Auth/PrivateRoute'
import { supabase } from './services/supabaseClient'
import { AuthContext } from './contexts/AuthContext'
import type { User } from '@supabase/supabase-js'

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  // Al montar, comprueba si ya hay sesión válida
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (session?.access_token) {
        localStorage.setItem('authToken', session.access_token)
      }
    })

    // Listener para cambios de estado (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)

      if (_event === 'SIGNED_IN' && session?.access_token) {
        localStorage.setItem('authToken', session.access_token)
      }
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('authToken')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Función para cerrar sesión desde UI
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('authToken')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={user ? <Navigate to="/transactions" replace /> : <LoginForm />}
          />

          <Route
            path="/register"
            element={user ? <Navigate to="/transactions" replace /> : <RegisterForm />}
          />

          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <TransactionsPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  )
}
