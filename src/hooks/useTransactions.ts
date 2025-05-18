// src/hooks/useTransactions.ts
import { useState, useEffect, useCallback } from 'react';
import { getTransactions } from '../services/transaction.service';
import type { Transaction } from '../../types/models';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
      setError(null);
    } catch {
      setError('No se pudieron cargar las transacciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { transactions, loading, error, refetch: fetch };
}
