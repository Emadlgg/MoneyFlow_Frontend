import React from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionChart   from '../components/Transactions/Charts/TransactionChart'

export default function ReportsPage() {
  const { transactions, loading, error } = useTransactions()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Gráficas</h1>
      {loading && <p>Cargando…</p>}
      {error   && <p className="text-red-500">{error.message}</p>}
      {!loading && <TransactionChart transactions={transactions} />}
    </div>
  )
}
