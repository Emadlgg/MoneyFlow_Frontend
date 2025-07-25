// src/pages/IncomesPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedAccount } from '../contexts/SelectedAccountContext'
import { useAccount } from '../contexts/AccountContext'
import CategoryManager from '../components/Categories/CategoryManager'
import './incomes.css'

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

export default function IncomesPage() {
  const { user } = useAuth()
  const { selectedAccountId } = useSelectedAccount()
  const { accounts, refetch: refetchAccounts } = useAccount()
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

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<number, Category>);
  }, [categories]);

  const fetchData = useCallback(async () => {
    if (!user || !selectedAccountId) {
      setTransactions([])
      setCategories([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('account_id', selectedAccountId)
          .gt('amount', 0) // Incomes
          .order('date', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name, color')
          .eq('user_id', user.id)
          .eq('type', 'income')
      ])

      if (transactionsRes.error) throw transactionsRes.error
      if (categoriesRes.error) throw categoriesRes.error
      
      setTransactions(transactionsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('Error fetching income data:', error)
      setTransactions([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [user, selectedAccountId]);

  useEffect(() => {
    fetchData()
  }, [fetchData]);

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
          amount: amount,
          category_id: parseInt(formData.category_id),
          type: 'income',
          date: new Date(formData.date).toISOString(),
          description: formData.description
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating income:', error)
        throw error
      }

      setTransactions(prev => [data, ...prev])
      
      setFormData({
        amount: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      })

      refetchAccounts()

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
        {/* Cambiamos <form> por <div> y le asignamos la clase del grid */}
        <div className="incomes-form">
          {/* --- Fila 1 --- */}
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

          {/* --- Fila 2 (Ancho completo) --- */}
          <div className="category-group">
            <label>Categoría</label>
            <CategoryManager
              type="income"
              selectedCategoryId={formData.category_id}
              onCategorySelect={(id) => setFormData(prev => ({ ...prev, category_id: id }))}
              onCategoriesUpdate={fetchData}
            />
          </div>

          {/* --- Fila 3 (Ancho completo) --- */}
          <div className="form-group description-group">
            <label>Descripción (Opcional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ej: Salario mensual"
              disabled={isSubmitting}
            />
          </div>

          {/* --- Fila 4 (Botón de envío) --- */}
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="submit-button"
            disabled={isSubmitting || !formData.category_id || !formData.amount}
          >
            {isSubmitting ? 'Agregando...' : 'Agregar Ingreso'}
          </button>
        </div>
      </div>

      <div className="incomes-list">
        <h2>Historial de Ingresos</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : transactions.length === 0 ? (
          <p>No hay ingresos registrados para esta cuenta.</p>
        ) : (
          <div className="transactions-grid">
            {transactions.map(transaction => {
              const category = categoryMap[transaction.category_id];
              return (
                <div key={transaction.id} className="transaction-card">
                  <div className="transaction-info">
                    <h3>${transaction.amount.toLocaleString()}</h3>
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
