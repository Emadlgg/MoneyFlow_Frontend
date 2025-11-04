import api from './api';

export interface Account {
  id: number;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  created_at: string;
}

export interface CreateAccountParams {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
}

export interface UpdateAccountParams {
  name?: string;
  type?: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
}

export const accountService = {
  /**
   * Obtiene todas las cuentas del usuario autenticado
   */
  async getAll(): Promise<Account[]> {
    const { data } = await api.get<Account[]>('/accounts');
    return data;
  },

  /**
   * Crea una nueva cuenta
   */
  async create(account: CreateAccountParams): Promise<Account> {
    const { data } = await api.post<Account>('/accounts', account);
    return data;
  },

  /**
   * Actualiza una cuenta existente
   */
  async update(id: number, updates: UpdateAccountParams): Promise<Account> {
    const { data } = await api.put<Account>(`/accounts/${id}`, updates);
    return data;
  },

  /**
   * Elimina una cuenta
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/accounts/${id}`);
  },
};
