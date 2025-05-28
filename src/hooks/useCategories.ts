import { useState, useEffect, useCallback } from 'react'
import { categoryService, Category }      from '../services/category.service'
import { useAuth }                        from '../contexts/AuthContext'

export function useCategories(type: 'ingreso' | 'gasto') {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<Error | null>(null)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await categoryService.getAll(user.id, type)
      setCategories(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user, type])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const add = useCallback(
    async (name: string) => {
      if (!user) return
      setLoading(true)
      try {
        await categoryService.create(user.id, name, type)
        await fetchAll()
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    },
    [fetchAll, type, user]
  )

  const remove = useCallback(
    async (id: number) => {
      setLoading(true)
      try {
        await categoryService.remove(id)
        await fetchAll()
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    },
    [fetchAll]
  )

  return { categories, loading, error, add, remove }
}
