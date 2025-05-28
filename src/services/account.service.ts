import { supabase } from './supabaseClient'

export interface Account {
  id: number
  user_id: string
  name: string
  created_at: string
}

export const accountService = {
  /** Devuelve todas las cuentas del usuario */
  async getAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /** Crea una nueva cuenta */
  async create(name: string): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({ name })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /** Elimina una cuenta por su id */
  async remove(id: number): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
