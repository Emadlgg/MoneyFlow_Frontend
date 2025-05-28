// src/components/layout/Header.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../contexts/AuthContext'
import './Header.css'

export default function Header() {
  const { user, signOut } = useAuth()
  const nav                = useNavigate()

  const handleLogout = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <header className="header">
      <h1 className="header__brand" onClick={() => nav(user ? '/incomes' : '/')}>
        MoneyFlow
      </h1>
      <nav className="header__nav">
        {user ? (
          <button onClick={handleLogout} className="header__link header__link--button">
            Logout
          </button>
        ) : (
          <>
            <button onClick={() => nav('/login')} className="header__link">
              Login
            </button>
            <button onClick={() => nav('/register')} className="header__link">
              Register
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
