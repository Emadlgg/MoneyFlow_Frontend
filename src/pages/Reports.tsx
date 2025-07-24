import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedAccount } from '../contexts/SelectedAccountContext'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

// Interfaz actualizada: quitamos 'type' y 'description' que no usamos aquí
interface Transaction {
  id: string
  amount: number
  category: string
  date: string
  account_id: string
}

interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

// Función helper para formatear fechas sin date-fns
const formatDate = (dateStr: string, format: string) => {
  const date = new Date(dateStr)
  
  if (format === 'yyyy-MM-dd') {
    return date.toISOString().split('T')[0]
  }
  
  if (format === 'MMM yyyy') {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                   'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }
  
  if (format === 'yyyy-MM') {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${year}-${month}`
  }
  
  return date.toLocaleDateString()
}

// Función para restar meses
const subtractMonths = (date: Date, months: number) => {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

export default function ReportsPage() {
  const { user } = useAuth()
  const { selectedAccountId } = useSelectedAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: formatDate(subtractMonths(new Date(), 5).toISOString(), 'yyyy-MM-dd'),
    end: formatDate(new Date().toISOString(), 'yyyy-MM-dd')
  })

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([])

  // CORRECCIÓN: La función ahora acepta un saldo inicial para el cálculo acumulativo
  const processChartData = (transactionsToProcess: Transaction[], startingBalance: number) => {
    const monthlyMap = new Map<string, { income: number; expense: number }>()
    const incomeMap = new Map<string, number>()
    const expenseMap = new Map<string, number>()

    transactionsToProcess.forEach(transaction => {
      const monthKey = formatDate(transaction.date, 'yyyy-MM')
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expense: 0 })
      }
      const monthlyEntry = monthlyMap.get(monthKey)!

      if (transaction.amount > 0) {
        monthlyEntry.income += transaction.amount
        incomeMap.set(transaction.category, (incomeMap.get(transaction.category) || 0) + transaction.amount)
      } else {
        const expenseValue = Math.abs(transaction.amount)
        monthlyEntry.expense += expenseValue
        expenseMap.set(transaction.category, (expenseMap.get(transaction.category) || 0) + expenseValue)
      }
    })

    let runningBalance = startingBalance; // Empezamos con el saldo anterior al rango
    const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([monthKey, data]) => {
        // CORRECCIÓN: El balance ahora es acumulativo
        runningBalance += data.income - data.expense;
        const date = new Date(monthKey + '-02T12:00:00Z')
        return {
          month: formatDate(date.toISOString(), 'MMM yyyy'),
          income: data.income,
          expense: data.expense,
          balance: runningBalance // Usamos el saldo acumulado
        }
      })
    
    setMonthlyData(monthlyArray)

    const colors = ['#28a745', '#007bff', '#ffc107', '#6f42c1', '#fd7e14']
    const expenseColors = ['#dc3545', '#e83e8c', '#6c757d', '#20c997', '#17a2b8']
    const incomeArray: CategoryData[] = Array.from(incomeMap.entries()).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }))
    const expenseArray: CategoryData[] = Array.from(expenseMap.entries()).map(([name, value], index) => ({ name, value, color: expenseColors[index % expenseColors.length] }))
    setIncomeCategories(incomeArray)
    setExpenseCategories(expenseArray)
  }

  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!user || !selectedAccountId) {
        setTransactions([])
        processChartData([], 0)
        return
      }
      setLoading(true)
      try {
        // 1. Obtener el saldo ANTES del rango de fechas seleccionado
        const { data: priorTransactions, error: priorError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('account_id', selectedAccountId)
          .lt('date', dateRange.start)

        if (priorError) throw priorError
        const startingBalance = priorTransactions.reduce((sum, t) => sum + t.amount, 0)

        // 2. Obtener las transacciones DENTRO del rango de fechas
        const { data, error } = await supabase
          .from('transactions')
          .select('id, amount, category, date, account_id')
          .eq('account_id', selectedAccountId)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true })

        if (error) throw error
        const fetchedTransactions = data || []
        setTransactions(fetchedTransactions)
        
        // 3. Procesar los datos pasando el saldo inicial
        processChartData(fetchedTransactions, startingBalance)

      } catch (error) {
        console.error('Error fetching report data:', error)
        setTransactions([])
        processChartData([], 0)
      } finally {
        setLoading(false)
      }
    }
    fetchAndProcessData()
  }, [user, selectedAccountId, dateRange])

  // CORRECCIÓN: Calcular totales basados en el signo del monto
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netBalance = totalIncome - totalExpense

  // Custom tooltip para las gráficas
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip__label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="chart-tooltip__value" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString('es-ES', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando reportes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedAccountId) {
    return (
      <div className="reports-page">
        <div className="no-data">
          <h3>📊 Reportes Financieros</h3>
          <p>Por favor selecciona una cuenta para ver los reportes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1 className="reports-title">📊 Reportes Financieros</h1>
        
        <div className="reports-controls">
          <div className="date-range">
            <label>Desde:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <label>Hasta:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Resumen de totales */}
      <div className="reports-summary">
        <div className="summary-card summary-card--income">
          <h3>💰 Total Ingresos</h3>
          <span className="summary-amount">
            ${totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="summary-card summary-card--expense">
          <h3>💸 Total Gastos</h3>
          <span className="summary-amount">
            ${totalExpense.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className={`summary-card ${netBalance >= 0 ? 'summary-card--positive' : 'summary-card--negative'}`}>
          <h3>💼 Balance Neto</h3>
          <span className="summary-amount">
            ${netBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Gráfica de tendencia mensual */}
      {monthlyData.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title">📈 Tendencia Mensual</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" name="Ingresos" fill="#28a745" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#dc3545" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfica de línea de balance */}
      {monthlyData.length > 0 && (
        <div className="chart-container">
          <h2 className="chart-title">📊 Balance Mensual</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="balance" 
                name="Balance" 
                stroke="#007bff" 
                strokeWidth={3}
                dot={{ fill: '#007bff', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráficas de torta por categorías */}
      <div className="charts-row">
        {/* Categorías de ingresos */}
        {incomeCategories.length > 0 && (
          <div className="chart-container chart-container--half">
            <h2 className="chart-title">💰 Ingresos por Categoría</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {incomeCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Categorías de gastos */}
        {expenseCategories.length > 0 && (
          <div className="chart-container chart-container--half">
            <h2 className="chart-title">💸 Gastos por Categoría</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {transactions.length === 0 && !loading && (
        <div className="no-data">
          <h3>📭 No hay datos para mostrar</h3>
          <p>No se encontraron transacciones en el rango de fechas seleccionado.</p>
          <p>Ve a <strong>Ingresos</strong> o <strong>Gastos</strong> para agregar transacciones.</p>
        </div>
      )}
    </div>
  )
}
