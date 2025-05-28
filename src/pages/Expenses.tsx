import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedAccount } from '../contexts/SelectedAccountContext'
import { useAccount } from '../contexts/AccountContext'
import CategoryManager from '../components/Categories/CategoryManager'
import './expenses.css'

interface Transaction {
  id: string
  amount: number
  category: string
  date: string
  account_id: string
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const { selectedAccountId } = useSelectedAccount()
  const { accounts } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId)

  const fetchExpenses = async () => {
    if (!user || !selectedAccountId) {
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', selectedAccountId)
        .lt('amount', 0) // Solo gastos (montos negativos)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [user, selectedAccountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAccountId) {
      alert('Selecciona una cuenta primero')
      return
    }

    if (!formData.amount || !formData.category || !formData.date) {
      alert('Completa todos los campos')
      return
    }

    setIsSubmitting(true)
    try {
      const amount = parseFloat(formData.amount)
      if (amount <= 0) {
        alert('El monto debe ser mayor a 0')
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          account_id: parseInt(selectedAccountId),
          amount: -amount, // Negativo para gastos
          category: formData.category,
          date: new Date(formData.date).toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating expense:', error)
        throw error
      }

      // Actualizar la lista local
      setTransactions(prev => [data, ...prev])
      
      // Limpiar formulario
      setFormData({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      })

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
      <div className="expenses-header">
        <h1>Gastos - {selectedAccount.name}</h1>
        <p>Saldo actual: ${selectedAccount.balance.toLocaleString()}</p>
      </div>

      <div className="expenses-form-container">
        <form onSubmit={handleSubmit} className="expenses-form">
          <div className="form-group">
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

          <CategoryManager
            type="expense"
            selectedCategory={formData.category}
            onCategorySelect={(category) => setFormData(prev => ({ ...prev, category }))}
          />

          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              disabled={isSubmitting}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting || !formData.category}
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
            {transactions.map(transaction => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-info">
                  <h3>${Math.abs(transaction.amount).toLocaleString()}</h3>
                  <p>{transaction.category}</p>
                  <p>{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
