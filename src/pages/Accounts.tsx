import React, { useState } from 'react'
import { useAccount } from '../contexts/AccountContext'
import ConfirmDialog from '../components/UI/ConfirmDialog'
import CreateAccountModal from '../components/Accounts/CreateAccountModal'
import EditAccountModal from '../components/Accounts/EditAccountModal' 

export default function AccountsPage() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccount() 
  
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    accountId: string | null
    accountName: string
  }>({
    isOpen: false,
    accountId: null,
    accountName: ''
  })
  
  // ✅ AGREGAR estado para el modal de edición
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    account: { id: string; name: string; type: string } | null
  }>({
    isOpen: false,
    account: null
  })
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ✅ AGREGAR función para abrir modal de edición
  const handleEditClick = (accountId: string, accountName: string, accountType: string) => {
    setEditModal({
      isOpen: true,
      account: { id: accountId, name: accountName, type: accountType }
    })
  }

  // ✅ AGREGAR función para manejar actualización
  const handleUpdateAccount = async (accountId: string, name: string, type: string) => {
    await updateAccount(accountId, name, type)
    setEditModal({ isOpen: false, account: null })
  }

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
                  Saldo: <span className="balance-amount">Q{account.balance.toLocaleString()}</span>
                </p>
              </div>
              <div className="account-card__actions">
                <button 
                  className="account-card__button account-card__button--edit"
                  disabled={isDeleting}
                  type="button"
                  onClick={() => handleEditClick(account.id, account.name, account.type)} // ✅ CAMBIAR
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

      {/* ✅ AGREGAR modal de edición */}
      <EditAccountModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, account: null })}
        onEditAccount={handleUpdateAccount}
        account={editModal.account}
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