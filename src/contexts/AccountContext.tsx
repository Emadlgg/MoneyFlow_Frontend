// src/contexts/AccountContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../services/supabaseClient'

export interface Account {
  id: number
  name: string
  // …otros campos si los hubiera
}

interface AccountContextValue {
  accounts: Account[]
  active: Account | null
  select: (id: number) => void
  refresh: () => void
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined)

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [active, setActive]     = useState<Account | null>(null)

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([])
      setActive(null)
      return
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')    // sin genéricos

    if (error) {
      console.error('Error fetching accounts:', error.message)
      return
    }

    // data viene tipado como any[], así que casteamos
    const rows = (data ?? []) as Account[]
    setAccounts(rows)

    // si la cuenta activa ya no está, la deseleccionamos
    if (active && !rows.some(a => a.id === active.id)) {
      setActive(null)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [user])

  const select = (id: number) => {
    const found = accounts.find(a => a.id === id) || null
    setActive(found)
  }

  const refresh = () => {
    fetchAccounts()
  }

  return (
    <AccountContext.Provider value={{ accounts, active, select, refresh }}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount debe usarse dentro de AccountProvider')
  return ctx
}
