// src/services/transaction.service.ts
import api from './api';
import type { Transaction } from '../../types/models';

export const createTransaction = async (
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction> => {
  const response = await api.post<Transaction>('/transactions', transaction);
  return response.data;  // extraemos .data porque interceptor devuelve whole response
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get<Transaction[]>('/transactions');
  return response.data;
};
