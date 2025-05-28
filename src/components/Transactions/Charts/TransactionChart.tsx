import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Transaction } from '../../../services/transaction.service'

interface Props {
  transactions: Transaction[]
}

export default function TransactionChart({ transactions }: Props) {
  const data = useMemo(() => {
    const acc: Record<string,{ month:string; ingreso:number; gasto:number }> = {}
    for (const tx of transactions) {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      if (!acc[key]) acc[key] = { month:key, ingreso:0, gasto:0 }
      if (tx.amount >= 0) acc[key].ingreso += tx.amount
      else acc[key].gasto += Math.abs(tx.amount)
    }
    return Object.values(acc).sort((a,b)=>a.month.localeCompare(b.month))
  }, [transactions])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top:20, right:30, left:0, bottom:5 }}>
        <XAxis dataKey="month" stroke="#ccc" tick={{ fontSize:12 }} />
        <YAxis stroke="#ccc" tick={{ fontSize:12 }} />
        <Tooltip contentStyle={{ backgroundColor:'#2a2a2a', border:'none' }} />
        <Legend verticalAlign="bottom" height={36} />
        <Bar dataKey="ingreso" name="Ingresos" fill="#4caf50" />
        <Bar dataKey="gasto"   name="Gastos"   fill="#f44336" />
      </BarChart>
    </ResponsiveContainer>
  )
}
