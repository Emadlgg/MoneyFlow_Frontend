import api from './api';
import { Transaction, ApiError } from '../../types/models';

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    try {
      const response = await api.post('/transactions', transaction);
      return response.data as Transaction;
    } catch (error) {
      throw error as ApiError;
    }
  };

export const getTransactions = async () => {
  try {
    const response = await api.get('/transactions');
    return response.data as Transaction[];
  } catch (error) {
    throw error as ApiError;
  }
};