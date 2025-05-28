// src/components/Transactions/Charts/TransactionChart.tsx
import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'      // <-- asegúrate que esto ya existe en node_modules
import { Transaction } from '../../../services/transaction.service'

interface Props {
  transactions: Transaction[]
}

export default function TransactionChart({ transactions }: Props) {
  // agrupar por mes…
  const data = useMemo(() => {
    const acc: Record<string, { month: string; ingreso: number; gasto: number }> = {}
    for (const tx of transactions) {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      if (!acc[key]) acc[key] = { month: key, ingreso: 0, gasto: 0 }
      if (tx.amount >= 0) acc[key].ingreso += tx.amount
      else acc[key].gasto += Math.abs(tx.amount)
    }
    return Object.values(acc).sort((a, b) => a.month.localeCompare(b.month))
  }, [transactions])

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="ingreso" name="Ingresos" />
          <Bar dataKey="gasto" name="Gastos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
