import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { transactionService } from '../services/transaction.service'
import { categoryService, Category } from '../services/category.service'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedAccount } from '../contexts/SelectedAccountContext'
import { useAccount } from '../contexts/AccountContext'
import CategoryManager from '../components/Categories/CategoryManager'
import SpendingAlerts, { SpendingAlertsRef } from '../components/SpendingAlerts'
import './expenses.css'

interface Transaction {
  id: string
  amount: number
  category_id: number
  date: string
  account_id: number  // Cambiado de string a number
  description?: string
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const { selectedAccountId } = useSelectedAccount()
  const { accounts, refetch: refetchAccounts } = useAccount()
  const spendingAlertsRef = useRef<SpendingAlertsRef>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editFormData, setEditFormData] = useState({
    amount: '',
    category_id: '',
    date: '',
    description: ''
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId)

  // Create a map for easy category lookup
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<number, Category>);
  }, [categories]);

  const fetchExpenses = useCallback(async () => {
    if (!user || !selectedAccountId) {
      setTransactions([])
      setCategories([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Fetch both transactions and categories
      const [transactionsData, categoriesData] = await Promise.all([
        transactionService.getAll({
          account_id: parseInt(selectedAccountId),
          type: 'expense'
        }),
        categoryService.getAll('expense') as Promise<Category[]>
      ]);

      setTransactions(transactionsData || [])
      setCategories((categoriesData || []) as Category[])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setTransactions([])
      setCategories([] as Category[])
    } finally {
      setLoading(false)
    }
  }, [user, selectedAccountId])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAccountId || !user) {
      alert('Selecciona una cuenta primero')
      return
    }

    if (!formData.amount || !formData.category_id || !formData.date) {
      alert('Completa todos los campos')
      return
    }

    setIsSubmitting(true)
    try {
      const amount = parseFloat(formData.amount)
      if (amount <= 0) {
        alert('El monto debe ser mayor a 0')
        setIsSubmitting(false)
        return
      }

      const newTransaction = await transactionService.create({
        account_id: parseInt(selectedAccountId),
        amount: amount,
        category_id: parseInt(formData.category_id),
        type: 'expense',
        date: new Date(formData.date).toISOString(),
        description: formData.description
      })

      // Actualizar la lista local
      setTransactions(prev => [newTransaction, ...prev]);
      
      // Limpiar formulario
      setFormData({
        amount: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      })

      // Refrescar el saldo de la cuenta
      refetchAccounts()

      // ¡VERIFICAR LÍMITES DESPUÉS DE AGREGAR GASTO!
      setTimeout(() => {
        spendingAlertsRef.current?.forceCheck()
      }, 1000)

    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error al agregar gasto. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      return
    }

    setDeletingId(transactionId)
    try {
      await transactionService.delete(parseInt(transactionId))
      
      // Actualizar la lista local eliminando la transacción
      setTransactions(prev => prev.filter(t => t.id !== transactionId))
      
      // Refrescar el saldo de la cuenta
      refetchAccounts()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Error al eliminar la transacción. Inténtalo de nuevo.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setEditFormData({
      amount: transaction.amount.toString(),
      category_id: transaction.category_id.toString(),
      date: transaction.date,
      description: transaction.description || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
    setEditFormData({
      amount: '',
      category_id: '',
      date: '',
      description: ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingTransaction) return

    const amount = parseFloat(editFormData.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }

    if (!editFormData.category_id) {
      alert('Por favor selecciona una categoría')
      return
    }

    setIsSavingEdit(true)
    try {
      const updates = {
        amount,
        category_id: parseInt(editFormData.category_id),
        date: editFormData.date,
        description: editFormData.description || undefined
      }

      await transactionService.update(editingTransaction.id, updates)
      
      // Actualizar la lista local
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id 
          ? { ...t, ...updates }
          : t
      ))
      
      // Refrescar el saldo de la cuenta
      refetchAccounts()
      
      // Cerrar modal
      handleCancelEdit()
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('Error al actualizar la transacción. Inténtalo de nuevo.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  if (!selectedAccount) {
    return (
      <div className="expenses-page">
        <div className="no-account-selected">
          <h2>No hay cuenta seleccionada</h2>
          <p>Selecciona una cuenta desde el sidebar para ver y agregar gastos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="expenses-page">
      {/* Componente de alertas con referencia */}
      <SpendingAlerts ref={spendingAlertsRef} />

      <div className="expenses-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Gastos - {selectedAccount.name}</h1>
            <p>Saldo actual: Q{selectedAccount.balance.toLocaleString()}</p>
          </div>
          
          {/* BOTÓN MOVIDO AQUÍ - Al lado del header */}
          <button 
            onClick={() => {
              console.log('🔄 Forzando verificación de límites...');
              spendingAlertsRef.current?.forceCheck();
            }}
            style={{
              background: '#dc3545',
              color: 'white',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#c82333';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#dc3545';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Verificar límites de gastos"
          >
            🔍 Verificar Límites
          </button>
        </div>
      </div>

      <div className="expenses-form-container">
        <form className="expenses-form" onSubmit={handleSubmit}>
          <div className="form-group amount-group">
            <label>Monto</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group date-group">
            <label>Fecha</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="category-group">
            <label>Categoría</label>
            <CategoryManager
              type="expense"
              selectedCategoryId={formData.category_id}
              onCategorySelect={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
              onCategoriesUpdate={fetchExpenses}
            />
          </div>

          <div className="form-group description-group">
            <label>Descripción (Opcional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ej: Supermercado"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting || !formData.category_id}
          >
            {isSubmitting ? 'Agregando...' : 'Agregar Gasto'}
          </button>
        </form>
      </div>

      <div className="expenses-list">
        <h2>Historial de Gastos</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : transactions.length === 0 ? (
          <p>No hay gastos registrados para esta cuenta.</p>
        ) : (
          <div className="transactions-grid">
            {transactions.map(transaction => {
              const category = categoryMap[transaction.category_id];
              return (
                <div 
                  key={transaction.id} 
                  className="transaction-card" 
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => handleEditClick(transaction)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTransaction(transaction.id)
                    }}
                    disabled={deletingId === transaction.id}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      cursor: deletingId === transaction.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      opacity: deletingId === transaction.id ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      zIndex: 10
                    }}
                    onMouseEnter={(e) => {
                      if (deletingId !== transaction.id) {
                        e.currentTarget.style.background = '#c82333';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#dc3545';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Eliminar transacción"
                  >
                    ✕
                  </button>
                  <div className="transaction-info">
                    <h3>Q{Math.abs(transaction.amount).toLocaleString()}</h3>
                    <p style={{ color: category?.color || '#ccc' }}>
                      {category?.name || 'Sin categoría'}
                    </p>
                    <p>{new Date(transaction.date).toLocaleDateString()}</p>
                    {transaction.description && <p className="transaction-description">{transaction.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTransaction && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={handleCancelEdit}
        >
          <div 
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>Editar Transacción</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '16px'
                }}
                disabled={isSavingEdit}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Categoría
              </label>
              <select
                value={editFormData.category_id}
                onChange={(e) => setEditFormData(prev => ({ ...prev, category_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '16px'
                }}
                disabled={isSavingEdit}
                required
              >
                <option value="">Seleccionar categoría</option>
                {categories
                  .filter(cat => cat.type === 'expense')
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              {editFormData.category_id && (
                <div 
                  style={{
                    marginTop: '8px',
                    height: '4px',
                    backgroundColor: categoryMap[parseInt(editFormData.category_id)]?.color || '#ccc',
                    borderRadius: '2px'
                  }}
                />
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Fecha
              </label>
              <input
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '16px'
                }}
                disabled={isSavingEdit}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Descripción (Opcional)
              </label>
              <input
                type="text"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ej: Supermercado"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '16px'
                }}
                disabled={isSavingEdit}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isSavingEdit ? 0.5 : 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editFormData.category_id || !editFormData.amount}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (isSavingEdit || !editFormData.category_id || !editFormData.amount) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: (isSavingEdit || !editFormData.category_id || !editFormData.amount) ? 0.5 : 1
                }}
              >
                {isSavingEdit ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
