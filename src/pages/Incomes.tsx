// src/pages/IncomesPage.tsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedAccount } from '../contexts/SelectedAccountContext'
import { useAccount } from '../contexts/AccountContext'
import CategoryManager from '../components/Categories/CategoryManager'

import './incomes.css'

interface Transaction {
  id: string
  amount: number
  category: string
  date: string
  account_id: string
}

export default function IncomesPage() {
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

  const fetchIncomes = async () => {
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
        .gt('amount', 0) // Solo ingresos (montos positivos)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching incomes:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncomes()
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
          amount: amount,
          category: formData.category,
          date: new Date(formData.date).toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating income:', error)
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

      // Refrescar el saldo de la cuenta
      // Aquí podrías llamar a una función para actualizar el saldo
      
    } catch (error) {
      console.error('Error adding income:', error)
      alert('Error al agregar ingreso. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedAccount) {
    return (
      <div className="incomes-page">
        <div className="no-account-selected">
          <h2>No hay cuenta seleccionada</h2>
          <p>Selecciona una cuenta desde el sidebar para ver y agregar ingresos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="incomes-page">
      <div className="incomes-header">
        <h1>Ingresos - {selectedAccount.name}</h1>
        <p>Saldo actual: ${selectedAccount.balance.toLocaleString()}</p>
      </div>

      <div className="incomes-form-container">
        <form onSubmit={handleSubmit} className="incomes-form">
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
            type="income"
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
            {isSubmitting ? 'Agregando...' : 'Agregar Ingreso'}
          </button>
        </form>
      </div>

      <div className="incomes-list">
        <h2>Historial de Ingresos</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : transactions.length === 0 ? (
          <p>No hay ingresos registrados para esta cuenta.</p>
        ) : (
          <div className="transactions-grid">
            {transactions.map(transaction => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-info">
                  <h3>${transaction.amount.toLocaleString()}</h3>
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
