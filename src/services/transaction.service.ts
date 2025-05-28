import { supabase } from './supabaseClient'

export interface Transaction {
  id: number
  user_id: string
  account_id: number
  category: string   // texto
  amount: number
  date: string
  created_at: string
  updated_at: string
}

export const transactionService = {
  /** Trae todas las transacciones de una cuenta */
  async getAll(accountId: number): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false })

    if (error) throw error
    return (data as Transaction[]) ?? []
  },

  /** Inserta una nueva transacción */
  async create(entry: {
    user_id: string
    account_id: number
    category: string
    amount: number
    date: string
  }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([entry])
      .select('*')
      .single()

    if (error) throw error
    return data as Transaction
  },

  /** Borra una transacción por su id */
  async remove(id: number): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

export const getTransactions  = transactionService.getAll
export const addTransaction    = transactionService.create
export const removeTransaction = transactionService.remove
