// src/pages/Transactions.tsx
import { useState, useEffect, useContext } from 'react';
import TransactionForm from '../components/Transactions/TransactionForm';
import TransactionList from '../components/Transactions/TransactionList';
import TransactionChart from '../components/Transactions/Charts/TransactionChart';
import { getTransactions } from '../services/transaction.service';
import type { Transaction } from '../../types/models';
import { AuthContext } from '../contexts/AuthContext';   // ① importamos el contexto

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const { user, logout } = useContext(AuthContext);    // ② extraemos user y logout

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleNewTransaction = async () => {
    await fetchTransactions();
  };

  // Si por alguna razón no hay usuario (aunque PrivateRoute lo previene)
  if (!user) {
    return <p className="p-4 text-center">Acceso denegado. Redirigiendo…</p>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <button
            onClick={fetchTransactions}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* *** HEADER *** */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hola, {user.email}</h1>
          <p className="text-gray-600">Administra tus transacciones</p>
        </div>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Cerrar sesión
        </button>
      </header>

      {/* *** LAYOUT DE FORM + LIST + CHART *** */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Crear Transacción</h2>
            <TransactionForm onSuccess={handleNewTransaction} />
          </div>
        </div>

        {/* List + Chart Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Transacciones Recientes</h2>
              <TransactionList transactions={transactions} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen de Gastos</h2>
              <div className="h-80">
                <TransactionChart transactions={transactions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
