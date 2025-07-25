import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedAccount } from '../contexts/SelectedAccountContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector, Tooltip } from 'recharts';
import './reports.css'; // Changed from Reports.css to match the filename

interface Transaction {
    amount: number;
    category_id: number;
    type: 'income' | 'expense';
    date: string;
}

interface Category {
    id: number;
    name: string;
    color: string;
    type: 'income' | 'expense';
}

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
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`$${value.toLocaleString()}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};


export default function ReportsPage() {
    const { user } = useAuth();
    const { selectedAccountId } = useSelectedAccount();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePieIndex, setActivePieIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !selectedAccountId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [transactionsRes, categoriesRes] = await Promise.all([
                    supabase
                        .from('transactions')
                        .select('amount, category_id, type, date')
                        .eq('user_id', user.id)
                        .eq('account_id', selectedAccountId),
                    supabase
                        .from('categories')
                        .select('id, name, color, type')
                        .eq('user_id', user.id)
                ]);

                if (transactionsRes.error) throw transactionsRes.error;
                if (categoriesRes.error) throw categoriesRes.error;

                setTransactions(transactionsRes.data || []);
                setCategories(categoriesRes.data || []);
            } catch (error) {
                console.error("Error fetching report data:", error);
                setTransactions([]);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, selectedAccountId]);

    const categoryMap = useMemo(() => {
        return categories.reduce((acc, category) => {
            acc[category.id] = category;
            return acc;
        }, {} as Record<number, Category>);
    }, [categories]);

    const reportData = useMemo(() => {
        const incomeByCat = new Map<number, number>();
        const expenseByCat = new Map<number, number>();
        let totalIncome = 0;
        let totalExpense = 0;

        for (const t of transactions) {
            if (t.type === 'income') {
                totalIncome += t.amount;
                incomeByCat.set(t.category_id, (incomeByCat.get(t.category_id) || 0) + t.amount);
            } else { // expense
                const positiveAmount = Math.abs(t.amount);
                totalExpense += positiveAmount;
                expenseByCat.set(t.category_id, (expenseByCat.get(t.category_id) || 0) + positiveAmount);
            }
        }

        const expenseChartData = Array.from(expenseByCat.entries()).map(([id, amount]) => ({
            name: categoryMap[id]?.name || 'Uncategorized',
            value: amount,
            color: categoryMap[id]?.color || '#8884d8'
        }));

        return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense, expenseChartData };
    }, [transactions, categoryMap]);
    
    const onPieEnter = (_: any, index: number) => {
        setActivePieIndex(index);
    };

    if (loading) {
        return <div className="reports-page"><p>Loading reports...</p></div>;
    }

    if (!selectedAccountId) {
        return (
            <div className="reports-page">
                <div className="no-account-selected">
                    <h2>No Account Selected</h2>
                    <p>Please select an account from the sidebar to view reports.</p>
                </div>
            </div>
        );
    }
    
    if (transactions.length === 0) {
        return (
             <div className="reports-page">
                <h2>Reports</h2>
                <p>No transaction data available for this account to generate reports.</p>
            </div>
        )
    }

    return (
        <div className="reports-page">
            <h2>Reports</h2>
            <div className="summary-cards">
                <div className="card">
                    <h4>Total Income</h4>
                    <p className="income">${reportData.totalIncome.toLocaleString()}</p>
                </div>
                <div className="card">
                    <h4>Total Expense</h4>
                    <p className="expense">${reportData.totalExpense.toLocaleString()}</p>
                </div>
                <div className="card">
                    <h4>Net Balance</h4>
                    <p className={reportData.netBalance >= 0 ? 'income' : 'expense'}>
                        ${reportData.netBalance.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="chart-container">
                <h3>Expense Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            activeIndex={activePieIndex}
                            activeShape={renderActiveShape}
                            data={reportData.expenseChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                        >
                            {reportData.expenseChartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
