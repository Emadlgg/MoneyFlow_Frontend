// src/components/Transactions/TransactionForm.tsx
import React, { FormEvent, useState } from 'react'

interface Props {
  categories: string[]
  onAdd: (entry: { category: string; amount: number; date: string }) => void
  type: 'Ingresos' | 'Gastos'
}

export default function TransactionForm({ categories, onAdd, type }: Props) {
  const [cat, setCat] = useState('')
  const [amt, setAmt] = useState(0)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!cat || amt <= 0) return
    onAdd({
      category: cat,
      amount: type === 'Gastos' ? -amt : amt,
      date: new Date().toISOString(),
    })
    setAmt(0)
  }

  return (
    <form onSubmit={handleSubmit} className="form-inline">
      <select value={cat} onChange={e => setCat(e.target.value)}>
        <option value="">-- Selecciona categoría --</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input
        type="number"
        value={amt}
        onChange={e => setAmt(Number(e.target.value))}
      />

      <button type="submit">
        {type === 'Gastos' ? 'Agregar gasto' : 'Agregar ingreso'}
      </button>
    </form>
  )
}
