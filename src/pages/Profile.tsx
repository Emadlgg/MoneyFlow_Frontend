// src/pages/Profile.tsx
import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  return (
    <div className="profile-page container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Mi Perfil</h1>
      {user && (
        <>
          <p className="mb-2 text-gray-200">
            <strong>Email:</strong> {user.email}
          </p>
          <button
            onClick={() => signOut()}
            className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Cerrar sesión
          </button>
        </>
      )}
    </div>
  )
}
