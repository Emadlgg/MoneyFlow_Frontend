import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { accountService } from '../services/account.service'
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
      const data = await accountService.getAll()
      
      // Validar que data sea un array
      if (!Array.isArray(data)) {
        console.error("❌ La respuesta no es un array:", data)
        setAccounts([])
        setError('Formato de respuesta inválido')
        return
      }
      
      const accountsData = data.map(acc => ({
        id: acc.id.toString(),
        user_id: acc.user_id,
        name: acc.name,
        type: acc.type || 'checking',
        balance: acc.balance || 0,
        created_at: acc.created_at || new Date().toISOString()
      }))
      setAccounts(accountsData)
      
      // Si no hay cuenta activa y hay cuentas, establecer la primera como activa
      if (!activeAccount && accountsData.length > 0) {
        setActiveAccount(accountsData[0])
      }
    } catch (err: any) {
      console.error("Error fetching accounts:", err)
      setAccounts([])
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

    try {
      await accountService.create({ 
        name, 
        type: type as any, 
        balance: initialBalance 
      })
      await fetchAccounts()
    } catch (error) {
      console.error("Error creating account:", error)
      throw error
    }
  };


  const updateAccount = async (accountId: string, name: string, type: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      await accountService.update(parseInt(accountId), { name, type: type as any })
      
      // Si la cuenta actualizada es la activa, actualizar también activeAccount
      if (activeAccount?.id === accountId) {
        setActiveAccount(prev => prev ? { ...prev, name, type } : undefined)
      }
      
      await fetchAccounts()
    } catch (error) {
      console.error("Error updating account:", error)
      throw error
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      await accountService.delete(parseInt(accountId))
      
      // Si la cuenta eliminada era la activa, limpiar activeAccount
      if (activeAccount?.id === accountId) {
        setActiveAccount(undefined)
      }
      
      await fetchAccounts()
    } catch (error) {
      console.error("Error deleting account:", error)
      throw error
    }
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