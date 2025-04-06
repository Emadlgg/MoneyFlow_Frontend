import { Transaction } from '../../../types/models';
import { formatDate, formatCurrency } from '../../../utils/formatting';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: number) => void;
}

const TransactionList = ({ transactions, onEdit, onDelete }: TransactionListProps) => {
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date || transaction.createdAt || '').toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTransactions).map(([date, dailyTransactions]) => (
        <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="font-medium text-gray-700">{date}</h3>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {dailyTransactions.map((transaction) => (
              <li key={transaction.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.category}
                    </p>
                    {transaction.date && (
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date, 'time')}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center">
                    <span className={`text-sm font-semibold ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                    
                    {(onEdit || onDelete) && (
                      <div className="ml-3 flex space-x-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(transaction)}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                            aria-label="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                        )}
                        
                        {onDelete && transaction.id && (
                          <button
                            onClick={() => transaction.id !== undefined && onDelete(transaction.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      
      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions found
        </div>
      )}
    </div>
  );
};

export default TransactionList;