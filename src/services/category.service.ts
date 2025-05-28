import { supabase } from './supabaseClient'

export interface Category {
  id: number
  user_id: string
  name: string
  transaction_type: 'ingreso' | 'gasto'
  created_at: string
}

export const categoryService = {
  /** Trae categorías de un usuario y un tipo (ingreso/gasto) */
  async getAll(userId: string, type: 'ingreso' | 'gasto'): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', type)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as Category[]) ?? []
  },

  /** Crea una categoría nueva */
  async create(userId: string, name: string, type: 'ingreso' | 'gasto'): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ user_id: userId, name, transaction_type: type }])
      .select('*')
      .single()

    if (error) throw error
    return data as Category
  },

  /** Elimina por ID */
  async remove(id: number): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
