import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAccount } from '../../contexts/AccountContext'
import { useSelectedAccount } from '../../contexts/SelectedAccountContext'
import './Sidebar.css'

export default function Sidebar() {
  const { signOut } = useAuth()
  const { accounts, refetch } = useAccount()
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId)

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId)
  }

  // Función para formatear números con animación
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">MoneyFlow</h2>
        <button 
          onClick={refetch} 
          className="sidebar__refresh"
          title="Actualizar datos"
          aria-label="Actualizar datos"
        >
          🔄
        </button>
      </div>

      {/* Selector de cuenta */}
      <div className="sidebar__account-selector">
        <h3 className="sidebar__section-title">Cuenta Activa</h3>
        {selectedAccount ? (
          <div className="sidebar__selected-account">
            <div className="sidebar__account-info">
              <span className="sidebar__account-name">{selectedAccount.name}</span>
              <span className="sidebar__account-balance">
                {formatCurrency(selectedAccount.balance)}
              </span>
            </div>
          </div>
        ) : (
          <p className="sidebar__no-account">Selecciona una cuenta</p>
        )}
      </div>

      {/* Lista de cuentas */}
      <div className="sidebar__accounts">
        <h3 className="sidebar__section-title">Mis Cuentas</h3>
        <ul className="sidebar__list">
          {accounts.map((account, index) => (
            <li 
              key={account.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button
                className={`sidebar__item ${selectedAccountId === account.id ? 'sidebar__item--active' : ''}`}
                onClick={() => handleAccountSelect(account.id)}
              >
                <div className="sidebar__account-item">
                  <span className="sidebar__account-item-name">{account.name}</span>
                  <span className="sidebar__account-item-balance">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        
        <Link to="/accounts" className="sidebar__manage">
          <span>📊</span>
          <span>Gestionar cuentas</span>
        </Link>
      </div>

      {/* Navegación principal */}
      <nav className="sidebar__nav">
        <Link 
          to="/incomes" 
          className={`sidebar__nav-link ${isActive('/incomes') ? 'sidebar__nav-link--active' : ''}`}
        >
          <span className="nav-icon">💰</span>
          <span>Ingresos</span>
        </Link>
        <Link 
          to="/expenses" 
          className={`sidebar__nav-link ${isActive('/expenses') ? 'sidebar__nav-link--active' : ''}`}
        >
          <span className="nav-icon">💸</span>
          <span>Gastos</span>
        </Link>
        <Link 
          to="/reports" 
          className={`sidebar__nav-link ${isActive('/reports') ? 'sidebar__nav-link--active' : ''}`}
        >
          <span className="nav-icon">📊</span>
          <span>Reportes</span>
        </Link>
        <Link 
          to="/profile" 
          className={`sidebar__nav-link ${isActive('/profile') ? 'sidebar__nav-link--active' : ''}`}
        >
          <span className="nav-icon">👤</span>
          <span>Perfil</span>
        </Link>
        <Link 
          to="/notifications" 
          className={`sidebar__nav-link ${isActive('/notifications') ? 'sidebar__nav-link--active' : ''}`}
        >
          <span className="nav-icon">🔔</span>
          <span>Notificaciones</span>
        </Link>
        <Link 
          to="/tips" 
          className={`sidebar__nav-link ${isActive('/tips') ? 'sidebar__nav-link--active' : ''}`}
        >
          <span className="nav-icon">💡</span>
          <span>Consejos</span>
        </Link>
      </nav>

      <button 
        onClick={signOut} 
        className="sidebar__logout"
        title="Cerrar sesión"
      >
        <span>🚪</span>
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  )
}