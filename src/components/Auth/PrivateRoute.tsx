// src/components/Auth/PrivateRoute.tsx
import React, { ReactNode, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useContext(AuthContext)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
