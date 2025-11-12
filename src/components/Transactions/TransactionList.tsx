// src/components/Transactions/TransactionList.tsx
import React from 'react'
import { Transaction } from '../../services/transaction.service'

interface Props {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export default function TransactionList({ transactions, onDelete }: Props) {
  return (
    <div className="container">
      {transactions.map(tx => (
        <div key={tx.id} className="card flex justify-between items-center">
          <div>
            <strong>Categoría {tx.category_id}</strong>{' '}
            <span>
              Q{Math.abs(tx.amount).toFixed(2)}{' '}
              <small>{new Date(tx.date).toLocaleDateString()}</small>
            </span>
          </div>
          <button onClick={() => onDelete(tx.id)}>🗑️</button>
        </div>
      ))}
    </div>
  )
}
