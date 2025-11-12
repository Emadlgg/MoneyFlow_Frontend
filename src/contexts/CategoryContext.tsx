import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { categoryService } from '../services/category.service'
import { useAuth } from './AuthContext'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  user_id: string | null
  is_default: boolean
  created_at: string
}

interface CategoryContextValue {
  categories: Category[]
  incomeCategories: Category[]
  expenseCategories: Category[]
  loading: boolean
  createCategory: (name: string, type: 'income' | 'expense', color?: string, spending_limit?: number | null) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined)

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const incomeCategories = categories.filter(cat => cat.type === 'income')
  const expenseCategories = categories.filter(cat => cat.type === 'expense')

  const fetchCategories = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching categories for user:', user?.id)
      
      if (!user) {
        console.log('📝 No user, skipping category fetch')
        setCategories([])
        return
      }

      // El backend ya filtra por usuario autenticado
      const data = await categoryService.getAll()
      const categoriesData = data.map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
        type: cat.type,
        color: cat.color || '#333333',
        user_id: cat.user_id,
        is_default: false,
        created_at: cat.created_at || new Date().toISOString()
      }))
      
      console.log('✅ Categories loaded:', categoriesData.length)
      setCategories(categoriesData)
    } catch (error) {
      console.error('❌ Error in fetchCategories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [user])

  const createCategory = async (name: string, type: 'income' | 'expense', color: string = '#333333', spending_limit: number | null = null) => {
    if (!user) {
      console.error('❌ No user authenticated')
      throw new Error('User not authenticated')
    }

    try {
      console.log('🔨 Creating category:', { name, type, color, spending_limit })

      // Verificar si ya existe una categoría con ese nombre para el usuario
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === name.toLowerCase() && cat.type === type
      )

      if (existingCategory) {
        console.error('❌ Category already exists:', existingCategory)
        throw new Error('Ya existe una categoría con ese nombre')
      }

      console.log('📤 Creating category via backend API')

      await categoryService.create({ name, type, color, spending_limit })
      
      console.log('✅ Category created successfully')
      console.log('🔄 Triggering refetch...')
      
      await fetchCategories()
      
    } catch (error) {
      console.error('❌ Error creating category:', error)
      throw error
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      console.log('🔨 Updating category:', id, updates)
      
      const category = categories.find(cat => cat.id === id)
      if (!category) {
        throw new Error('Categoría no encontrada')
      }

      await categoryService.update(parseInt(id), {
        name: updates.name,
        color: updates.color
      })
      
      console.log('✅ Category updated successfully')
      await fetchCategories()
    } catch (error) {
      console.error('❌ Error updating category:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      console.log('🗑️ Deleting category:', id)
      
      const category = categories.find(cat => cat.id === id)
      if (!category) {
        throw new Error('Categoría no encontrada')
      }

      await categoryService.delete(parseInt(id))
      
      console.log('✅ Category deleted successfully')
      await fetchCategories()
    } catch (error) {
      console.error('❌ Error deleting category:', error)
      throw error
    }
  }

  const refetch = async () => {
    await fetchCategories()
  }

  return (
    <CategoryContext.Provider value={{ 
      categories,
      incomeCategories,
      expenseCategories,
      loading, 
      createCategory, 
      updateCategory, 
      deleteCategory,
      refetch 
    }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategory() {
  const ctx = useContext(CategoryContext)
  if (!ctx) throw new Error('useCategory must be used within CategoryProvider')
  return ctx
}