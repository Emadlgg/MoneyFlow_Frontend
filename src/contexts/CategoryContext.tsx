import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../services/supabaseClient'
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
  createCategory: (name: string, type: 'income' | 'expense', color?: string) => Promise<void>
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
        console.log('📝 No user, fetching default categories only')
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_default', true)
          .order('name')

        if (error) {
          console.error('❌ Error fetching default categories:', error)
          throw error
        }
        console.log('✅ Default categories loaded:', data?.length)
        setCategories(data || [])
      } else {
        console.log('📝 User authenticated, fetching all categories')
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.eq.${user.id},is_default.eq.true`)
          .order('name')

        if (error) {
          console.error('❌ Error fetching user categories:', error)
          throw error
        }
        console.log('✅ All categories loaded:', data?.length)
        setCategories(data || [])
      }
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

  const createCategory = async (name: string, type: 'income' | 'expense', color: string = '#333333') => {
    if (!user) {
      console.error('❌ No user authenticated')
      throw new Error('User not authenticated')
    }

    try {
      console.log('🔨 STARTING createCategory function:', { name, type, color, user_id: user.id })

      // Verificar si ya existe una categoría con ese nombre para el usuario
      const existingCategory = categories.find(
        cat => cat.name.toLowerCase() === name.toLowerCase() && 
               cat.type === type && 
               (cat.user_id === user.id || cat.is_default)
      )

      if (existingCategory) {
        console.error('❌ Category already exists:', existingCategory)
        throw new Error('Ya existe una categoría con ese nombre')
      }

      const categoryData = {
        name: name.trim(),
        type,
        color,
        user_id: user.id,
        is_default: false
      }

      console.log('📤 INSERTING category data:', categoryData)

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error creating category:', error)
        throw error
      }
      
      console.log('✅ Category created successfully:', data)
      console.log('🔄 Updating local categories state...')
      
      // IMPORTANTE: Forzar un refetch completo en lugar de solo agregar
      setCategories(prev => {
        const newCategories = [...prev, data]
        console.log('📊 Updated categories count:', newCategories.length)
        return newCategories
      })
      
      // También hacer un refetch para estar seguros
      console.log('🔄 Triggering refetch...')
      setTimeout(() => {
        fetchCategories()
      }, 100)
      
    } catch (error) {
      console.error('❌ Error creating category:', error)
      throw error
    }
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      console.log('🔨 Updating category:', id, updates)
      
      const category = categories.find(cat => cat.id === id)
      if (!category || category.is_default) {
        throw new Error('No puedes editar categorías por defecto')
      }

      const { data, error } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user?.id)
        .eq('is_default', false)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error updating category:', error)
        throw error
      }
      
      console.log('✅ Category updated successfully:', data)
      setCategories(prev => prev.map(category => 
        category.id === id ? { ...category, ...data } : category
      ))
    } catch (error) {
      console.error('❌ Error updating category:', error)
      throw error
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      console.log('🗑️ Deleting category:', id)
      
      const category = categories.find(cat => cat.id === id)
      if (!category || category.is_default) {
        throw new Error('No puedes eliminar categorías por defecto')
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)
        .eq('is_default', false)

      if (error) {
        console.error('❌ Supabase error deleting category:', error)
        throw error
      }
      
      console.log('✅ Category deleted successfully')
      setCategories(prev => prev.filter(category => category.id !== id))
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