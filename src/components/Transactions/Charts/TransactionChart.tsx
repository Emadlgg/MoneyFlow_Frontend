import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Transaction } from '../../../../types/models';

interface TransactionChartProps {
  transactions: Transaction[];
}

const TransactionChart = ({ transactions }: TransactionChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current && transactions.length > 0) {
      const categories = [...new Set(transactions.map(t => t.category))];
      const dataByCategory = categories.map(category => 
        transactions
          .filter(t => t.category === category)
          .reduce((sum, t) => sum + t.amount, 0)
      );

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: categories,
          datasets: [{
            label: 'Amount by Category',
            data: dataByCategory,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
            ],
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [transactions]);

  return <canvas ref={chartRef} />;
};

export default TransactionChart;