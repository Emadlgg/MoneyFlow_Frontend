import { useState } from 'react';
import { Transaction, ApiError } from '../../../types/models';
import { createTransaction } from '../../services/transaction.service';

interface TransactionFormProps {
  onSuccess: () => void;
}

const TransactionForm = ({ onSuccess }: TransactionFormProps) => {
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    amount: 0,
    category: '',
    date: new Date()
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction(formData);
      onSuccess();
      setFormData({ amount: 0, category: '', date: new Date() });
      setErrors({});
    } catch (error) {
      const apiError = error as ApiError;
      setErrors(apiError.details || { general: apiError.message || 'Error desconocido' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Amount</label>
        <input
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium">Category</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.category && <p className="text-red-500 text-xs">{errors.category}</p>}
      </div>

      {errors.general && (
        <p className="text-red-500 text-xs">{errors.general}</p>
      )}

      <button 
        type="submit" 
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
      >
        Add Transaction
      </button>
    </form>
  );
};

export default TransactionForm;