import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { Transaction } from '../../../../types/models';

interface Props {
  transactions?: Transaction[];
}

export default function TransactionChart({ transactions = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart>();

  const { labels, data } = useMemo(() => {
    const cats = Array.from(new Set(transactions.map(t => t.category)));
    const sums = cats.map(cat =>
      transactions.filter(t => t.category === cat)
                  .reduce((acc, t) => acc + t.amount, 0)
    );
    return { labels: cats, data: sums };
  }, [transactions]);

  useEffect(() => {
    if (!canvasRef.current || labels.length === 0) return;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Gastos por categoría',
          data,
          backgroundColor: labels.map(() => 'rgba(54,162,235,0.7)')
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    return () => { chartRef.current?.destroy(); };
  }, [labels, data]);

  if (labels.length === 0) {
    return <p className="text-center text-gray-500">Sin datos para el gráfico</p>;
  }

  return <canvas ref={canvasRef} />;
}
