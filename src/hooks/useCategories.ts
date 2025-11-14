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
      // getAll solo acepta type como parámetro opcional
      const apiType = type === 'ingreso' ? 'income' : 'expense'
      const data = await categoryService.getAll(apiType)
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
        // create acepta CreateCategoryParams
        const apiType = type === 'ingreso' ? 'income' : 'expense'
        await categoryService.create({ name, type: apiType })
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
        // El método correcto es 'delete', no 'remove'
        await categoryService.delete(id)
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
