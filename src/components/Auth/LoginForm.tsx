import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../../assets/style/auth.css'    // tu fichero con .auth-page y .auth-page__form...

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      navigate('/incomes')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-page__form">
        <h2 className="auth-page__title">Iniciar sesión</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}

        <div className="auth-page__content">
          <div className="auth-page__box">
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-page__input"
            />
            <label className="auth-page__label">Email</label>
          </div>

          <div className="auth-page__box">
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-page__input"
            />
            <label className="auth-page__label">Contraseña</label>
          </div>

          <div className="auth-page__check-group">
            <label className="auth-page__check">
              <input type="checkbox" className="auth-page__check-input"/>
              <span className="auth-page__check-label">Recuérdame</span>
            </label>
            <NavLink to="#" className="auth-page__forgot">
              ¿Olvidaste tu contraseña?
            </NavLink>
          </div>
        </div>

        <button type="submit" className="auth-page__button">
          Entrar
        </button>

        <p className="auth-page__register">
          ¿No tienes cuenta? <NavLink to="/register">Regístrate</NavLink>
        </p>
      </form>
    </div>
  )
}
