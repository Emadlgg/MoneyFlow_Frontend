import api from './api';

export interface Category {
  id: number;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  spending_limit?: number | null;
  created_at: string;
}

export interface CreateCategoryParams {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  spending_limit?: number | null;
}

export interface UpdateCategoryParams {
  name?: string;
  color?: string;
}

export const categoryService = {
  /**
   * Obtiene todas las categorías del usuario
   * @param type - Filtro opcional por tipo (income/expense)
   */
  async getAll(type?: 'income' | 'expense'): Promise<Category[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    
    const queryString = params.toString();
    const url = queryString ? `/categories?${queryString}` : '/categories';
    
    const { data } = await api.get<Category[]>(url);
    return data;
  },

  /**
   * Crea una nueva categoría
   */
  async create(category: CreateCategoryParams): Promise<Category> {
    const { data } = await api.post<Category>('/categories', category);
    return data;
  },

  /**
   * Actualiza una categoría existente
   */
  async update(id: number, updates: UpdateCategoryParams): Promise<Category> {
    const { data } = await api.put<Category>(`/categories/${id}`, updates);
    return data;
  },

  /**
   * Elimina una categoría
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
