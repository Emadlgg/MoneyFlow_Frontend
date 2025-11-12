import React, { useState, useEffect, useMemo, useRef } from 'react';
import { transactionService } from '../services/transaction.service';
import { categoryService } from '../services/category.service';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedAccount } from '../contexts/SelectedAccountContext';
import { useAccount } from '../contexts/AccountContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { pdf } from '@react-pdf/renderer';
import { AccountReportPDF } from '../components/AccountReportPDF';
import html2canvas from 'html2canvas';
import './reports.css';

// --- Interfaces ---
interface Transaction {
    amount: number;
    category_id: number;
    type: 'income' | 'expense';
    date: string;
}

interface Category {
    id: number;
    name:string;
    color: string;
    type: 'income' | 'expense';
}

// --- Componente para el gráfico de pastel activo ---
const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14}>
                {payload.name}
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Q${value.toLocaleString()}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

// --- Componente Principal de Reportes ---
export default function ReportsPage() {
    const { user } = useAuth();
    const { selectedAccountId } = useSelectedAccount();
    const { accounts } = useAccount();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeExpenseIndex, setActiveExpenseIndex] = useState(0);
    const [activeIncomeIndex, setActiveIncomeIndex] = useState(0);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [chartImages, setChartImages] = useState<{
        trendChart?: string;
        expenseChart?: string;
        incomeChart?: string;
    }>({});
    
    // Obtener cuenta seleccionada
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
    
    // Referencias a los contenedores de las gráficas
    const trendChartRef = useRef<HTMLDivElement>(null);
    const expenseChartRef = useRef<HTMLDivElement>(null);
    const incomeChartRef = useRef<HTMLDivElement>(null);
    
    // Estado para el rango de fechas
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Inicio del año actual
        end: new Date().toISOString().split('T')[0], // Hoy
    });

    // --- Fetching de Datos ---
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !selectedAccountId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [transactionsData, categoriesData] = await Promise.all([
                    transactionService.getAll({ account_id: parseInt(selectedAccountId) }),
                    categoryService.getAll()
                ]);

                // Filtrar por rango de fechas
                const filteredTransactions = transactionsData.filter(t => {
                    const transactionDate = new Date(t.date).toISOString().split('T')[0];
                    return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
                });

                setTransactions(filteredTransactions);
                setCategories(categoriesData.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color || '#333333',
                    type: cat.type
                })));
            } catch (error) {
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, selectedAccountId, dateRange]);

    // --- Procesamiento de Datos ---
    const categoryMap = useMemo(() => categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {} as Record<number, Category>), [categories]);

    const reportData = useMemo(() => {
        const monthlyData = new Map<string, { income: number, expense: number }>();
        const expenseByCat = new Map<number, number>();
        const incomeByCat = new Map<number, number>();
        let totalIncome = 0;
        let totalExpense = 0;

        for (const t of transactions) {
            const month = t.date.substring(0, 7); // YYYY-MM
            if (!monthlyData.has(month)) monthlyData.set(month, { income: 0, expense: 0 });

            if (t.type === 'income') {
                totalIncome += t.amount;
                incomeByCat.set(t.category_id, (incomeByCat.get(t.category_id) || 0) + t.amount);
                monthlyData.get(month)!.income += t.amount;
            } else {
                const positiveAmount = Math.abs(t.amount);
                totalExpense += positiveAmount;
                expenseByCat.set(t.category_id, (expenseByCat.get(t.category_id) || 0) + positiveAmount);
                monthlyData.get(month)!.expense += positiveAmount;
            }
        }

        const expenseChartData = Array.from(expenseByCat.entries()).map(([id, amount]) => ({ name: categoryMap[id]?.name || 'Sin Categoría', value: amount, color: categoryMap[id]?.color || '#8884d8' }));
        const incomeChartData = Array.from(incomeByCat.entries()).map(([id, amount]) => ({ name: categoryMap[id]?.name || 'Sin Categoría', value: amount, color: categoryMap[id]?.color || '#82ca9d' }));
        const trendChartData = Array.from(monthlyData.entries()).sort().map(([month, data]) => ({ month, ...data }));

        return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense, expenseChartData, incomeChartData, trendChartData };
    }, [transactions, categoryMap]);

    // --- Handlers ---
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Función para capturar las gráficas como imágenes en base64
    const captureCharts = async () => {
        const images: { trendChart?: string; expenseChart?: string; incomeChart?: string } = {};
        
        try {
            // Capturar solo el gráfico de tendencia
            if (trendChartRef.current) {
                const canvas = await html2canvas(trendChartRef.current, {
                    backgroundColor: '#ffffff',
                    scale: 2, // Mayor calidad
                });
                images.trendChart = canvas.toDataURL('image/png');
            }
            
            return images;
        } catch (error) {
            console.error('Error capturando gráficas:', error);
            return {};
        }
    };

    // Función para generar y descargar el PDF automáticamente
    const handleDownloadPDF = async () => {
        setGeneratingPDF(true);
        try {
            // 1. Capturar gráficas
            const images = await captureCharts();
            
            // 2. Generar el PDF con las imágenes
            const pdfDoc = pdf(
                <AccountReportPDF
                    accountName={selectedAccount?.name || 'Sin nombre'}
                    dateRange={dateRange}
                    reportData={{ ...reportData, categoryMap }}
                    transactions={transactions}
                    chartImages={images}
                />
            );
            
            // 3. Convertir a blob
            const blob = await pdfDoc.toBlob();
            
            // 4. Crear link de descarga temporal
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Reporte_${dateRange.start}_a_${dateRange.end}.pdf`;
            
            // 5. Trigger descarga
            document.body.appendChild(link);
            link.click();
            
            // 6. Limpiar
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            alert('Error al generar el PDF. Inténtalo de nuevo.');
        } finally {
            setGeneratingPDF(false);
        }
    };

    // --- Renderizado ---
    if (loading) return <div className="reports-page"><p>Cargando reportes...</p></div>;
    if (!selectedAccountId) return <div className="reports-page"><div className="no-account-selected"><h2>Selecciona una cuenta para ver los reportes.</h2></div></div>;

    return (
        <div className="reports-page">
            <h2 className="reports-title">Reportes</h2>
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              style={{ 
                marginBottom: '16px', 
                padding: '8px 16px', 
                background: generatingPDF ? '#6c757d' : '#007bff', 
                color: '#fff', 
                borderRadius: 4, 
                border: 'none', 
                cursor: generatingPDF ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {generatingPDF ? '⏳ Generando PDF...' : '📄 Descargar PDF'}
            </button>
            <div id="report-content">
                <div className="date-filter-container">
                    <div className="form-group">
                        <label htmlFor="start">Desde:</label>
                        <input type="date" id="start" name="start" value={dateRange.start} onChange={handleDateChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="end">Hasta:</label>
                        <input type="date" id="end" name="end" value={dateRange.end} onChange={handleDateChange} />
                    </div>
                </div>

                <div className="summary-cards">
                    <div className="card"><h4 >Ingresos Totales</h4><p className="income">Q{reportData.totalIncome.toLocaleString()}</p></div>
                    <div className="card"><h4>Gastos Totales</h4><p className="expense">Q{reportData.totalExpense.toLocaleString()}</p></div>
                    <div className="card"><h4>Balance Neto</h4><p className={reportData.netBalance >= 0 ? 'income' : 'expense'}>Q{reportData.netBalance.toLocaleString()}</p></div>
                </div>

                {transactions.length === 0 ? (
                    <div className="no-data-message">No hay transacciones en el período seleccionado.</div>
                ) : (
                    <>
                        <div className="chart-container" ref={trendChartRef}>
                            <h3>Tendencia de Ingresos vs. Gastos (Mensual)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.trendChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `Q${value.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="income" fill="#28a745" name="Ingresos" />
                                    <Bar dataKey="expense" fill="#dc3545" name="Gastos" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="pie-charts-container">
                            <div className="chart-container" ref={expenseChartRef}>
                                <h3>Distribución de Gastos</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie activeIndex={activeExpenseIndex} activeShape={renderActiveShape} data={reportData.expenseChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" onMouseEnter={(_, index) => setActiveExpenseIndex(index)}>
                                            {reportData.expenseChartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-container" ref={incomeChartRef}>
                                <h3>Distribución de Ingresos</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie activeIndex={activeIncomeIndex} activeShape={renderActiveShape} data={reportData.incomeChartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" onMouseEnter={(_, index) => setActiveIncomeIndex(index)}>
                                            {reportData.incomeChartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
