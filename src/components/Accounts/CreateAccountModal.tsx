import React, { useState } from 'react'
import { useAccount } from '../../contexts/AccountContext'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateAccountModal({ isOpen, onClose }: CreateAccountModalProps) {
  const { createAccount } = useAccount() // Usar el contexto
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const accountTypes = [
    { value: 'checking', label: 'Cuenta Corriente' },
    { value: 'savings', label: 'Cuenta de Ahorros' },
    { value: 'credit', label: 'Tarjeta de Crédito' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'investment', label: 'Inversiones' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('El nombre de la cuenta es requerido')
      return
    }

    setIsLoading(true)
    try {
      await createAccount(formData.name.trim(), formData.type, formData.balance) // Llamar a la función del contexto
      setFormData({ name: '', type: 'checking', balance: 0 })
      onClose()
    } catch (error: any) {
      console.error('Error creating account:', error)
      setError(error.message || 'Error al crear la cuenta.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', type: 'checking', balance: 0 })
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Crear Nueva Cuenta</h2>
          <button 
            className="modal__close"
            onClick={handleClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          {error && (
            <div className="modal__error">
              {error}
            </div>
          )}

          <div className="modal__field">
            <label className="modal__label">Nombre de la cuenta</label>
            <input
              type="text"
              className="modal__input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Cuenta Principal"
              disabled={isLoading}
              required
            />
          </div>

          <div className="modal__field">
            <label className="modal__label">Tipo de cuenta</label>
            <select
              className="modal__select"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              disabled={isLoading}
            >
              {accountTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal__field">
            <label className="modal__label">Saldo inicial</label>
            <input
              type="number"
              step="0.01"
              className="modal__input"
              value={formData.balance}
              onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="modal__button modal__button--cancel"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal__button modal__button--create"
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}