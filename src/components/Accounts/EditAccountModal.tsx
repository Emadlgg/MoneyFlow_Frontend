import React, { useState, useEffect } from 'react'

interface EditAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onEditAccount: (accountId: string, name: string, type: string) => Promise<void>
  account: {
    id: string
    name: string
    type: string
  } | null
}

export default function EditAccountModal({ 
  isOpen, 
  onClose, 
  onEditAccount,
  account 
}: EditAccountModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (account) {
      setName(account.name)
      setType(account.type)
      setError('')
    }
  }, [account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!account) return
    
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!type) {
      setError('El tipo es requerido')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onEditAccount(account.id, name.trim(), type)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la cuenta')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Cuenta</h2>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="edit-name">Nombre de la cuenta</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cuenta Principal"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-type">Tipo de cuenta</label>
            <select
              id="edit-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSubmitting}
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="Ahorros">Ahorros</option>
              <option value="Corriente">Corriente</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Inversión">Inversión</option>
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="account-card__button account-card__button--edit"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="accounts-add-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}