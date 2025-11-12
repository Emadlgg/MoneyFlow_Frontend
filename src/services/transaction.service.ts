import api from './api';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category_id: number;
  account_id: number;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  created_at?: string;
}

export interface CreateTransactionParams {
  amount: number;
  category_id: number;
  account_id: number;
  type: 'income' | 'expense';
  date?: string;
  description?: string;
}

export interface UpdateTransactionParams {
  amount?: number;
  category_id?: number;
  date?: string;
  description?: string;
}

export const transactionService = {
  /**
   * Obtiene todas las transacciones del usuario autenticado
   * @param filters - Filtros opcionales (account_id, type, category_id, start_date, end_date)
   */
  async getAll(filters?: { 
    account_id?: number; 
    type?: 'income' | 'expense';
    category_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters?.account_id) params.append('account_id', filters.account_id.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const queryString = params.toString();
    const url = queryString ? `/transactions?${queryString}` : '/transactions';
    
    const { data } = await api.get<Transaction[]>(url);
    return data;
  },

  /**
   * Crea una nueva transacción
   */
  async create(transaction: CreateTransactionParams): Promise<Transaction> {
    const { data } = await api.post<Transaction>('/transactions', transaction);
    return data;
  },

  /**
   * Actualiza una transacción existente
   */
  async update(id: string, updates: UpdateTransactionParams): Promise<Transaction> {
    const { data } = await api.put<Transaction>(`/transactions/${id}`, updates);
    return data;
  },

  /**
   * Elimina una transacción
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },
};

export const getTransactions  = transactionService.getAll;
export const addTransaction    = transactionService.create;
export const removeTransaction = transactionService.delete;
