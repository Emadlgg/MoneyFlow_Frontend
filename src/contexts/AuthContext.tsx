import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, pass: string) => Promise<void>
  signIn: (email: string, pass: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session: Session | null) => {
        console.log('Auth event:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Si el usuario se autentica exitosamente (incluye OAuth)
        if (event === 'SIGNED_IN' && session?.user) {
          // Solo redirigir si estamos en una página de auth, no desde home
          const currentPath = window.location.pathname
          if (currentPath === '/login' || currentPath === '/register') {
            window.location.href = '/incomes'
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass })
    if (error) throw error
  }

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}