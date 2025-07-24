import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from './AuthContext'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  user_id: string
  created_at: string
}

interface AccountContextValue {
  accounts: Account[]
  refetch: () => void
  isLoading: boolean
  error: string | null
  createAccount: (name: string, type: string, balance: number) => Promise<void>
  deleteAccount: (accountId: string) => Promise<void>
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined)

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error
      setAccounts(data || [])
    } catch (err: any) {
      console.error("Error fetching accounts:", err)
      setError(err.message || 'Failed to fetch accounts')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const createAccount = async (name: string, type: string, balance: number) => {
    if (!user) throw new Error("Usuario no autenticado.");

    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({ user_id: user.id, name, type, balance })
      .select()
      .single();

    if (accountError) throw accountError;

    if (balance > 0) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({ user_id: user.id, account_id: newAccount.id, amount: balance, category: 'Saldo Inicial', date: new Date().toISOString() });
      
      if (transactionError) throw transactionError;
    }
    
    await fetchAccounts(); // Refresca la lista
  };

  const deleteAccount = async (accountId: string) => {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
    
    await fetchAccounts(); // Refresca la lista
  };

  const value = {
    accounts,
    refetch: fetchAccounts,
    isLoading,
    error,
    createAccount,
    deleteAccount
  }

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be used within AccountProvider')
  return ctx
}