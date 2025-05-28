import { useState, useEffect, useCallback } from 'react'
import {
  getTransactions,
  addTransaction,
  removeTransaction,
  type Transaction
} from '../services/transaction.service'
import { useAccount } from '../contexts/AccountContext'
import { useAuth }    from '../contexts/AuthContext'

export function useTransactions() {
  const { active: account } = useAccount()
  const { user }            = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<Error | null>(null)

  const fetchAll = useCallback(async () => {
    if (!account) return
    setLoading(true)
    try {
      const data = await getTransactions(account.id)
      setTransactions(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const add = useCallback(
    async (entry: {
      category: string
      amount:   number
      date:     string
    }) => {
      if (!account || !user) return
      setLoading(true)
      try {
        await addTransaction({
          user_id:    user.id,
          account_id: account.id,
          category:   entry.category,
          amount:     entry.amount,
          date:       entry.date,
        })
        await fetchAll()
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    },
    [account, user, fetchAll]
  )

  const remove = useCallback(
    async (id: number) => {
      setLoading(true)
      try {
        await removeTransaction(id)
        await fetchAll()
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    },
    [fetchAll]
  )

  return { transactions, loading, error, fetchAll, add, remove }
}
