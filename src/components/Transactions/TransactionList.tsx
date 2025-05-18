import React, { useMemo } from 'react';
import { Transaction } from '../../../types/models';
import { formatDate, formatCurrency } from '../../../utils/formatting';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface Props {
  transactions?: Transaction[];
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: number) => void;
}

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete
}: Props) {
  // Agrupar por fecha
  const grouped = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const day = new Date(tx.date || tx.createdAt || '')
        .toLocaleDateString();
      acc[day] = acc[day] || [];
      acc[day].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-gray-500">No transactions found</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([day, list]) => (
        <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium text-gray-700">{day}</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {list.map(tx => (
              <li key={tx.id} className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.category}</p>
                  {tx.date && (
                    <p className="text-xs text-gray-500">
                      {formatDate(tx.date, 'time')}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`font-semibold ${
                    tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(tx.amount)}
                  </span>
                  {onEdit && <button onClick={() => onEdit(tx)} aria-label="Edit"><FiEdit /></button>}
                  {onDelete && <button onClick={() => onDelete(tx.id!)} aria-label="Delete"><FiTrash2 /></button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
