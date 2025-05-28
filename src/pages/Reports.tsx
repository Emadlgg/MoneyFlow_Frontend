import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useSelectedAccount } from '../contexts/SelectedAccountContext'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
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

  // Estados para los datos de las gráficas
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([])

  const fetchTransactions = async () => {
    if (!user || !selectedAccountId) return

    try {
      setLoading(true)
      console.log('📊 Fetching transactions for reports...')

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('account_id', selectedAccountId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching transactions:', error)
        throw error
      }

      console.log('📊 Transactions loaded:', data?.length)
      setTransactions(data || [])
      processChartData(data || [])
    } catch (error) {
      console.error('Error in fetchTransactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const processChartData = (transactions: Transaction[]) => {
    console.log('📊 Processing chart data...')

    // Procesar datos mensuales
    const monthlyMap = new Map<string, { income: number; expense: number }>()

    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = subtractMonths(new Date(), i)
      const monthKey = formatDate(date.toISOString(), 'yyyy-MM')
      monthlyMap.set(monthKey, { income: 0, expense: 0 })
    }

    // Agrupar transacciones por mes
    transactions.forEach(transaction => {
      const monthKey = formatDate(transaction.date, 'yyyy-MM')
      const existing = monthlyMap.get(monthKey)
      
      if (existing) {
        if (transaction.type === 'income') {
          existing.income += transaction.amount
        } else {
          existing.expense += transaction.amount
        }
      }
    })

    // Convertir a array para las gráficas
    const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries()).map(([monthKey, data]) => {
      const date = new Date(monthKey + '-01')
      return {
        month: formatDate(date.toISOString(), 'MMM yyyy'),
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense
      }
    })

    setMonthlyData(monthlyArray)

    // Procesar categorías de ingresos
    const incomeMap = new Map<string, number>()
    const expenseMap = new Map<string, number>()

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        incomeMap.set(transaction.category, (incomeMap.get(transaction.category) || 0) + transaction.amount)
      } else {
        expenseMap.set(transaction.category, (expenseMap.get(transaction.category) || 0) + transaction.amount)
      }
    })

    // Colores para las categorías
    const colors = [
      '#28a745', '#dc3545', '#007bff', '#ffc107', '#6f42c1',
      '#e83e8c', '#fd7e14', '#20c997', '#17a2b8', '#6c757d'
    ]

    // Convertir a arrays para pie charts
    const incomeArray: CategoryData[] = Array.from(incomeMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))

    const expenseArray: CategoryData[] = Array.from(expenseMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))

    setIncomeCategories(incomeArray)
    setExpenseCategories(expenseArray)

    console.log('📊 Chart data processed:', {
      monthly: monthlyArray.length,
      incomeCategories: incomeArray.length,
      expenseCategories: expenseArray.length
    })
  }

  useEffect(() => {
    fetchTransactions()
  }, [user, selectedAccountId, dateRange])

  // Calcular totales
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

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

      {transactions.length === 0 && (
        <div className="no-data">
          <h3>📭 No hay datos para mostrar</h3>
          <p>No se encontraron transacciones en el rango de fechas seleccionado.</p>
          <p>Ve a <strong>Ingresos</strong> o <strong>Gastos</strong> para agregar transacciones.</p>
        </div>
      )}
    </div>
  )
}
