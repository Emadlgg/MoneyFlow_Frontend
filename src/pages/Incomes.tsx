// src/pages/Incomes.tsx
import React, { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories }   from '../hooks/useCategories'
import TransactionForm     from '../components/Transactions/TransactionForm'
import TransactionList     from '../components/Transactions/TransactionList'
import type { Transaction } from '../services/transaction.service'

export default function IncomesPage() {
  // Hook de transacciones (trae todas las de la cuenta activa)
  const { transactions, loading, error, add, remove } = useTransactions()
  // Hook de categorías de ingreso
  const {
    categories,
    add: addCategory,
    loading: catLoading,
  } = useCategories('ingreso')

  // Sólo ingresos (monto > 0)
  const ingresos = transactions.filter(
    (t): t is Transaction => t.amount > 0
  )

  // Estado para nueva categoría
  const [newCat, setNewCat] = useState('')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Ingresos</h1>

      {/* Crear categoría de ingreso */}
      <div className="form-inline mb-4">
        <input
          type="text"
          placeholder="Nueva categoría"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          className="px-3 py-2 border rounded flex-1"
        />
        <button
          onClick={() => {
            const name = newCat.trim()
            if (name) {
              addCategory(name)  // guarda con transaction_type = 'ingreso'
              setNewCat('')
            }
          }}
          disabled={catLoading}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Añadir categoría
        </button>
      </div>

      {/* Formulario con categorías de ingreso */}
      <TransactionForm
        categories={categories.map(c => c.name)}
        type="Ingresos"
        onAdd={({ category, amount }) =>
          add({
            category,
            amount: Math.abs(amount),               // ingresos positivos
            date: new Date().toISOString(),
          })
        }
      />

      {/* Estados */}
      {(loading || catLoading) && <p>Cargando…</p>}
      {error && <p className="text-red-500">{error.message}</p>}
      {!loading && ingresos.length === 0 && <p>No hay ingresos aún.</p>}

      {/* Lista de ingresos */}
      {ingresos.length > 0 && (
        <TransactionList
          transactions={ingresos}
          onDelete={id => remove(id)}
        />
      )}
    </div>
  )
}
