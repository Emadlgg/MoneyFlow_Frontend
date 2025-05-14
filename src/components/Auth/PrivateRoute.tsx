// src/components/Auth/PrivateRoute.tsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user } = useContext(AuthContext);
  return user
    ? children
    : <Navigate to="/login" replace />;
}
