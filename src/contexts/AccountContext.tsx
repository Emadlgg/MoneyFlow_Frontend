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

  const createAccount = async (name: string, type: string, initialBalance: number) => {
    if (!user) throw new Error("User not authenticated");

    // The RPC call is now simpler
    const { data, error } = await supabase.rpc('create_account_with_initial_transaction', {
      p_user_id: user.id,
      p_account_name: name,
      p_account_type: type,
      p_initial_balance: initialBalance
    });

    if (error) {
      console.error("Error creating account:", error);
      throw error;
    }
    
    await fetchAccounts(); // Changed from refetch()
    return data;
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