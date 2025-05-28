import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SelectedAccountContextValue {
  selectedAccountId: string | null
  setSelectedAccountId: (accountId: string | null) => void
}

const SelectedAccountContext = createContext<SelectedAccountContextValue | undefined>(undefined)

export function SelectedAccountProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  // Guardar en localStorage para persistir la selección
  useEffect(() => {
    const saved = localStorage.getItem('selectedAccountId')
    if (saved) {
      setSelectedAccountId(saved)
    }
  }, [])

  const handleSetSelectedAccountId = (accountId: string | null) => {
    setSelectedAccountId(accountId)
    if (accountId) {
      localStorage.setItem('selectedAccountId', accountId)
    } else {
      localStorage.removeItem('selectedAccountId')
    }
  }

  return (
    <SelectedAccountContext.Provider value={{ 
      selectedAccountId, 
      setSelectedAccountId: handleSetSelectedAccountId 
    }}>
      {children}
    </SelectedAccountContext.Provider>
  )
}

export function useSelectedAccount() {
  const ctx = useContext(SelectedAccountContext)
  if (!ctx) throw new Error('useSelectedAccount must be used within SelectedAccountProvider')
  return ctx
}