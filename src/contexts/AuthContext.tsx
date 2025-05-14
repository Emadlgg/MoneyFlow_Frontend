import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../../types/models';

interface AuthContextProps {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  setUser: () => {},
  logout: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
