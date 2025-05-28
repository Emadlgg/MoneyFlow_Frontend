// src/pages/Accounts.tsx
import React, { useState } from 'react'
import { useAccount } from '../contexts/AccountContext'
import { accountService } from '../services/account.service'

export default function AccountsPage() {
  const { accounts, refresh } = useAccount()
  const [newName, setNewName] = useState('')

  const create = async () => {
    if (!newName.trim()) return
    await accountService.create(newName.trim())
    setNewName('')
    await refresh()
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl mb-4">Cuentas</h1>
      <div className="form-inline mb-6">
        <input
          type="text"
          placeholder="Nueva cuenta"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button onClick={create}>Crear cuenta</button>
      </div>

      <ul>
        {accounts.map(acc => (
          <li key={acc.id}>{acc.name}</li>
        ))}
      </ul>
    </div>
  )
}
