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
  loading: boolean
  error: string | null
  createAccount: (name: string, type: string, balance: number) => Promise<void>
  updateAccount: (accountId: string, name: string, type: string) => Promise<void> // ✅ AGREGADO
  deleteAccount: (accountId: string) => Promise<void>
  active?: Account
  setActive: (account: Account) => void 
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined)

export const AccountProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAccount, setActiveAccount] = useState<Account | undefined>(undefined)

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error
      const accountsData = data || []
      setAccounts(accountsData)
      
      // Si no hay cuenta activa y hay cuentas, establecer la primera como activa
      if (!activeAccount && accountsData.length > 0) {
        setActiveAccount(accountsData[0])
      }
    } catch (err: any) {
      console.error("Error fetching accounts:", err)
      setError(err.message || 'Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [user, activeAccount])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const createAccount = async (name: string, type: string, initialBalance: number) => {
    if (!user) throw new Error("User not authenticated");

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
    
    await fetchAccounts();
    return data;
  };


  const updateAccount = async (accountId: string, name: string, type: string) => {
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from('accounts')
      .update({ name, type })
      .eq('id', accountId)
      .eq('user_id', user.id) // Seguridad: solo actualizar cuentas del usuario

    if (error) {
      console.error("Error updating account:", error);
      throw error;
    }
    
    // Si la cuenta actualizada es la activa, actualizar también activeAccount
    if (activeAccount?.id === accountId) {
      setActiveAccount(prev => prev ? { ...prev, name, type } : undefined)
    }
    
    await fetchAccounts();
  };

  const deleteAccount = async (accountId: string) => {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
    
    // Si la cuenta eliminada era la activa, limpiar activeAccount
    if (activeAccount?.id === accountId) {
      setActiveAccount(undefined)
    }
    
    await fetchAccounts();
  };

  // Función para establecer cuenta activa
  const setActive = useCallback((account: Account) => {
    setActiveAccount(account)
  }, [])

  const value: AccountContextValue = {
    accounts,
    refetch: fetchAccounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    active: activeAccount,
    setActive,
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