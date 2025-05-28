import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAccount } from '../../contexts/AccountContext'
import { useAuth }    from '../../contexts/AuthContext'
import './Sidebar.css'

export default function Sidebar() {
  const { accounts, active, select, refresh } = useAccount()
  const { signOut } = useAuth()
  const navigate    = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">Cuentas</h2>
        <button
          className="sidebar__refresh"
          title="Refrescar cuentas"
          onClick={refresh}
        >
          ↻
        </button>
      </div>

      <ul className="sidebar__list">
        {accounts.map(acc => (
          <li key={acc.id}>
            <button
              className={`sidebar__item ${
                acc.id === active?.id ? 'sidebar__item--active' : ''
              }`}
              onClick={() => select(acc.id)}
            >
              {acc.name}
            </button>
          </li>
        ))}
        <li>
          <NavLink to="/accounts" className="sidebar__manage">
            + Gestionar cuentas
          </NavLink>
        </li>
      </ul>

      <nav className="sidebar__nav">
        <NavLink to="/incomes"  className={linkClass}>Ingresos</NavLink>
        <NavLink to="/expenses" className={linkClass}>Gastos</NavLink>
        <NavLink to="/reports"  className={linkClass}>Gráficas</NavLink>
      </nav>

      <button className="sidebar__logout" onClick={handleLogout}>
        Cerrar sesión
      </button>
    </aside>
)
}
