// src/services/transaction.service.ts
import { supabase } from './supabaseClient'
import type { Transaction } from '../../types/models'

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data!
}

export async function createTransaction(t: Omit<Transaction,'id'>) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([t])
    .single()
  if (error) throw error
  return data!
}

export async function deleteTransaction(id: number) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  if (error) throw error
}
