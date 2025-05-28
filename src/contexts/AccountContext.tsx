import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
  loading: boolean
  createAccount: (name: string, type: string, balance: number) => Promise<void>
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Fetching accounts for user:', user.id)
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching accounts:', error)
        throw error
      }
      
      console.log('Fetched accounts:', data)
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [user])

  const createAccount = async (name: string, type: string, balance: number) => {
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('Creating account:', { name, type, balance, user_id: user.id })
      
      const { data, error } = await supabase
        .from('accounts')
        .insert([{
          name,
          type,
          balance,
          user_id: user.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Account created successfully:', data)
      setAccounts(prev => [data, ...prev])
    } catch (error) {
      console.error('Error creating account:', error)
      throw error
    }
  }

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      console.log('Updating account:', id, updates)
      
      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Account updated successfully:', data)
      setAccounts(prev => prev.map(account => 
        account.id === id ? { ...account, ...data } : account
      ))
    } catch (error) {
      console.error('Error updating account:', error)
      throw error
    }
  }

  const deleteAccount = async (id: string) => {
    try {
      console.log('Deleting account:', id)
      
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Account deleted successfully')
      setAccounts(prev => prev.filter(account => account.id !== id))
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  const refetch = async () => {
    await fetchAccounts()
  }

  return (
    <AccountContext.Provider value={{ 
      accounts, 
      loading, 
      createAccount, 
      updateAccount, 
      deleteAccount,
      refetch 
    }}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be used within AccountProvider')
  return ctx
}