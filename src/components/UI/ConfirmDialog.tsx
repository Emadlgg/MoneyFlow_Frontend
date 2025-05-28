import React from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
  isLoading = false
}: ConfirmDialogProps) {
  console.log('ConfirmDialog render:', { isOpen, isLoading })

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    console.log('Overlay clicked')
    if (e.target === e.currentTarget && !isLoading) {
      onCancel()
    }
  }

  const handleConfirm = () => {
    console.log('Confirm button clicked')
    onConfirm()
  }

  const handleCancel = () => {
    console.log('Cancel button clicked')
    onCancel()
  }

  return (
    <div className="confirm-dialog-overlay" onClick={handleOverlayClick}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button 
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={handleCancel}
            disabled={isLoading}
            type="button"
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-dialog__button ${isDestructive ? 'confirm-dialog__button--danger' : 'confirm-dialog__button--confirm'}`}
            onClick={handleConfirm}
            disabled={isLoading}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}