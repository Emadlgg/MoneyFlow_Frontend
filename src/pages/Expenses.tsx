import React, { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories }   from '../hooks/useCategories'
import TransactionForm     from '../components/Transactions/TransactionForm'
import TransactionList     from '../components/Transactions/TransactionList'
import type { Transaction } from '../services/transaction.service'

export default function ExpensesPage() {
  const { transactions, loading, error, add, remove } = useTransactions()
  const {
    categories,
    add: addCategory,
    loading: catLoading
  } = useCategories('gasto')

  const gastos = transactions.filter(
    (t): t is Transaction => t.amount < 0
  )

  const [newCat, setNewCat] = useState('')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Gastos</h1>

      {/* Crear categoría de gasto */}
      <div className="form-inline mb-4">
        <input
          type="text"
          placeholder="Nueva categoría"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
        />
        <button
          onClick={() => {
            const name = newCat.trim()
            if (name) {
              addCategory(name)  // guarda con transaction_type = 'gasto'
              setNewCat('')
            }
          }}
        >
          Añadir categoría
        </button>
      </div>

      {/* Formulario con categorías de gasto */}
      <TransactionForm
        categories={categories.map(c => c.name)}
        type="Gastos"
        onAdd={({ category, amount }) =>
          add({
            category,
            amount: -Math.abs(amount),            // gastos negativos
            date: new Date().toISOString(),
          })
        }
      />

      {(loading || catLoading) && <p>Cargando…</p>}
      {error && <p className="text-red-500">{error.message}</p>}
      {!loading && gastos.length === 0 && <p>No hay gastos aún.</p>}

      {gastos.length > 0 && (
        <TransactionList
          transactions={gastos}
          onDelete={id => remove(id)}
        />
      )}
    </div>
  )
}
