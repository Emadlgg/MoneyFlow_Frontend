import React, { useState } from 'react'
import { useAccount } from '../contexts/AccountContext'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import CreateAccountModal from '../components/Accounts/CreateAccountModal'

export default function AccountsPage() {
  const { accounts, loading, createAccount, deleteAccount } = useAccount()
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    accountId: string | null
    accountName: string
  }>({
    isOpen: false,
    accountId: null,
    accountName: ''
  })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (accountId: string, accountName: string) => {
    setDeleteDialog({
      isOpen: true,
      accountId,
      accountName
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog.accountId) return

    setIsDeleting(true)
    try {
      await deleteAccount(deleteDialog.accountId)
      setDeleteDialog({ isOpen: false, accountId: null, accountName: '' })
    } catch (error) {
      console.error('Error al eliminar cuenta:', error)
      alert('Error al eliminar la cuenta. Inténtalo de nuevo.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setDeleteDialog({ isOpen: false, accountId: null, accountName: '' })
    }
  }

  const handleCreateAccount = async (name: string, type: string, balance: number) => {
    await createAccount(name, type, balance)
  }

  if (loading) {
    return (
      <div className="accounts-page">
        <div className="loading-message">Cargando cuentas...</div>
      </div>
    )
  }

  return (
    <div className="accounts-page">
      <div className="accounts-header">
        <h1>Gestionar Cuentas</h1>
        <button 
          className="accounts-add-button"
          onClick={() => setIsCreateModalOpen(true)}
          type="button"
        >
          + Agregar Cuenta
        </button>
      </div>
      
      {accounts.length === 0 ? (
        <div className="accounts-empty">
          <p>No tienes cuentas registradas aún.</p>
          <button 
            className="accounts-add-button"
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
          >
            Crear tu primera cuenta
          </button>
        </div>
      ) : (
        <div className="accounts-list">
          {accounts.map(account => (
            <div key={account.id} className="account-card">
              <div className="account-card__info">
                <h3 className="account-card__name">{account.name}</h3>
                <p className="account-card__type">Tipo: {account.type}</p>
                <p className="account-card__balance">
                  Saldo: <span className="balance-amount">${account.balance.toLocaleString()}</span>
                </p>
              </div>
              <div className="account-card__actions">
                <button 
                  className="account-card__button account-card__button--edit"
                  disabled={isDeleting}
                  type="button"
                  onClick={() => {
                    // Aquí puedes agregar la lógica de editar después
                    console.log('Editar cuenta:', account.id)
                  }}
                >
                  Editar
                </button>
                <button 
                  className="account-card__button account-card__button--delete"
                  onClick={() => handleDeleteClick(account.id, account.name)}
                  disabled={isDeleting}
                  type="button"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateAccount={handleCreateAccount}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Eliminar cuenta"
        message={`¿Estás seguro de que quieres eliminar la cuenta "${deleteDialog.accountName}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText={isDeleting ? "Eliminando..." : "Eliminar"}
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  )
}