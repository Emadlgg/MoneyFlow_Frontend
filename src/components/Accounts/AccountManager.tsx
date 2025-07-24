import React, { useState } from 'react'
import { useAccount } from '../../contexts/AccountContext'
import CreateAccountModal from './CreateAccountModal'
import './AccountManager.css'

export default function AccountManager() {
  const { accounts, isLoading, error, deleteAccount } = useAccount()
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta cuenta? Todas sus transacciones también serán eliminadas.")) {
      return;
    }
    try {
      await deleteAccount(accountId);
      alert('Cuenta eliminada exitosamente.');
    } catch (err: any) {
      console.error("Error deleting account:", err);
      alert(`Error al eliminar la cuenta: ${err.message}`);
    }
  };

  if (isLoading) return <div>Cargando cuentas...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="account-manager">
      <div className="account-manager__header">
        <h2>Mis Cuentas</h2>
        <button 
          className="account-manager__add-button"
          onClick={() => setCreateModalOpen(true)}
        >
          + Nueva Cuenta
        </button>
      </div>
      
      <div className="account-list">
        {accounts.map(account => (
          <div key={account.id} className="account-item">
            <div className="account-item__info">
              <span>{account.name} ({account.type})</span>
              <span>{account.balance.toLocaleString('es-GT', { style: 'currency', currency: 'GTQ' })}</span>
            </div>
            <button 
              className="account-item__delete-button"
              onClick={() => handleDeleteAccount(account.id)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <CreateAccountModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  )
}