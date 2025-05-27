// src/components/Auth/LoginForm.tsx
import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabaseClient'
import GoogleLoginButton from './GoogleLoginButton'
import '../../assets/style/auth.css'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string|null>(null)
  const { user }                = useContext(AuthContext)
  const navigate                = useNavigate()

  // Si venimos del callback OAuth, redirige
  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      if (session?.user) {
        navigate('/transactions', { replace: true })
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  if (user) return <Navigate to="/transactions" replace />

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-page__form">
        <h2 className="auth-page__title">Login</h2>
        {error && <p className="auth-page__error">{error}</p>}

        <div className="auth-page__content">
          <div className="auth-page__box">
            <i className="auth-page__icon">📧</i>
            <div className="auth-page__box-input">
              <input
                type="email"
                placeholder=" "
                className="auth-page__input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <label className="auth-page__label">Email</label>
            </div>
          </div>

          <div className="auth-page__box">
            <i className="auth-page__icon">🔒</i>
            <div className="auth-page__box-input">
              <input
                type="password"
                placeholder=" "
                className="auth-page__input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label className="auth-page__label">Password</label>
            </div>
          </div>
        </div>

        <button type="submit" className="auth-page__button">Entrar</button>

        <GoogleLoginButton/>

        <p className="auth-page__register">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </div>
  )
}
