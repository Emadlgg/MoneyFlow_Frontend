import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
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
  account_id: string
  description?: string
}

interface Category {
  id: number;
  name: string;
  color: string;
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
      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('account_id', selectedAccountId)
          .lt('amount', 0), // Expenses
        supabase
          .from('categories')
          .select('id, name, color')
          .eq('user_id', user.id)
          .eq('type', 'expense')
      ]);

      if (transactionsRes.error) throw transactionsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setTransactions(transactionsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setTransactions([])
      setCategories([])
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

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          account_id: parseInt(selectedAccountId),
          amount: -amount, // Negativo para gastos
          category_id: parseInt(formData.category_id),
          type: 'expense',
          date: new Date(formData.date).toISOString(),
          description: formData.description
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating expense:', error)
        throw error
      }

      // Actualizar la lista local
      setTransactions(prev => [data, ...prev]);
      
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

      {/* BOTÓN DE TESTING - ELIMINAR DESPUÉS */}
      <button 
        onClick={() => {
          console.log('🔄 Forzando verificación de límites...');
          spendingAlertsRef.current?.forceCheck();
        }}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 9999,
          background: '#dc3545',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        🔍 VERIFICAR LÍMITES AHORA
      </button>

      <div className="expenses-header">
        <h1>Gastos - {selectedAccount.name}</h1>
        <p>Saldo actual: ${selectedAccount.balance.toLocaleString()}</p>
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
                <div key={transaction.id} className="transaction-card">
                  <div className="transaction-info">
                    <h3>${Math.abs(transaction.amount).toLocaleString()}</h3>
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
    </div>
  )
}
