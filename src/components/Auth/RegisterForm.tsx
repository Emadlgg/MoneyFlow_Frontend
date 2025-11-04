// src/components/Auth/RegisterForm.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../../services/auth.service'
import GoogleLoginButton from './GoogleLoginButton'
import '../../assets/style/auth.css'

export default function RegisterForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string|null>(null)
  const navigate                = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      await registerUser(email, password)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al registrar usuario')
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-page__form">
        <h2 className="auth-page__title">Registro</h2>
        {error && <p className="auth-page__error">{error}</p>}

        <div className="auth-page__content">
          <div className="auth-page__box">
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

        <button type="submit" className="auth-page__button">Registrarme</button>
        
        <div className="auth-divider">
          <span>O</span>
        </div>
        
        <GoogleLoginButton/>

        <p className="auth-page__register">
          ¿Ya tienes cuenta? <Link to="/login">Entra</Link>
        </p>
      </form>
    </div>
  )
}
