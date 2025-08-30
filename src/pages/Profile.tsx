// src/pages/Profile.tsx
import React, { useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user, signOut, updateProfile } = useAuth() as any
  const navigate = useNavigate()

  const displayName = user?.displayName || user?.name || user?.email?.split?.('@')?.[0] || 'Usuario'
  const email = user?.email ?? ''
  const uid = user?.id ?? user?.sub ?? user?.uid ?? ''
  const createdAt = (user?.createdAt || user?.created_at || user?.user_metadata?.created_at) ?? null
  const lastLogin = (user?.lastLogin || user?.last_login || user?.user_metadata?.last_sign_in_at) ?? null

  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const initials = useMemo(() => {
    if (!displayName) return 'U'
    return displayName
      .split(' ')
      .map(s => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [displayName])

  // Small styled button component (local, keeps logic intact)
  function Button({ children, variant = 'primary', style: s, ...props }: any) {
    const [hover, setHover] = useState(false)
    const base: React.CSSProperties = {
      padding: '8px 12px',
      borderRadius: 10,
      fontWeight: 700,
      cursor: 'pointer',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      transition: 'transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease',
      transform: hover ? 'translateY(-2px)' : undefined,
      boxShadow: hover ? '0 10px 24px rgba(2,6,23,0.4)' : '0 6px 18px rgba(2,6,23,0.18)',
      opacity: hover ? 0.98 : 1,
    }

    const variants: Record<string, React.CSSProperties> = {
      primary: { background: '#6d28d9', color: '#fff' }, // violet
      accent: { background: '#7c3aed', color: '#fff' }, // slightly different violet
      neutral: { background: '#111827', color: '#fff' }, // dark neutral
      ghost: { background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.04)' },
      danger: { background: '#dc2626', color: '#fff' },
      small: { padding: '6px 10px', borderRadius: 8, fontSize: 13 },
    }

    const combined = Object.assign({}, base, variants[variant] || variants.primary, s || {})

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <button
        {...props}
        style={combined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </button>
    )
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      if (typeof updateProfile === 'function') {
        await updateProfile({ displayName: nameDraft })
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' })
      } else {
        setMessage({ type: 'info', text: 'Actualización simulada (sin backend).' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error al guardar.' })
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  function handleSignOut() {
    const ok = window.confirm('¿Cerrar sesión? Asegúrate de guardar tus cambios.')
    if (ok) signOut?.()
  }

  function copyId() {
    try {
      navigator.clipboard?.writeText(uid)
      setMessage({ type: 'success', text: 'ID copiado al portapapeles.' })
      setTimeout(() => setMessage(null), 2200)
    } catch {
      setMessage({ type: 'error', text: 'No se pudo copiar el ID.' })
    }
  }

  return (
    <div className="profile-page container mx-auto p-6 max-w-4xl">
      {/* contenedor principal: más espacio interior para respirar */}
      <div
        className="bg-surface-dark rounded-lg"
        style={{
          padding: 24,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.36))',
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between" style={{ gap: 28 }}>
          {/* left: avatar + name/email */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 800,
              color: '#0b1220',
              background: 'linear-gradient(180deg,#cfeffd,#9fe7ff)',
              boxShadow: '0 10px 28px rgba(2,6,23,0.55)'
            }} aria-hidden>
              {initials}
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-color, #e6eef8)', lineHeight: 1 }}>{displayName}</h1>
              <div className="text-sm text-gray-300" style={{ marginTop: 6 }}>{email || 'Sin correo registrado'}</div>
            </div>
          </div>

          {/* right: actions (solo Editar y Notificaciones) - mayor separación y orden */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={() => { setEditing(true); setNameDraft(displayName) }} title="Editar tu nombre visible" aria-label="Editar perfil" style={{ minWidth: 120, padding: '10px 14px' }}>
              <span style={{ fontSize: 14 }}>✏️</span> <span style={{ fontWeight: 800 }}>Editar</span>
            </Button>

            <Button variant="primary" onClick={() => navigate('/notifications')} title="Abrir preferencias de notificaciones" aria-label="Preferencias de notificación" style={{ minWidth: 150, padding: '10px 16px' }}>
              🔔 Notificaciones
            </Button>
          </div>
        </div>

        {/* meta: solo fecha de creación (se quita 'Última sesión') - más espacio */}
        <div className="mt-8" style={{ maxWidth: 640 }}>
          <div style={{ padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)', background: 'transparent' }}>
            <div className="text-xs text-gray-400">Creado</div>
            <div className="text-sm text-gray-200" style={{ marginTop: 8 }}>{createdAt ? new Date(createdAt).toLocaleString() : '—'}</div>
          </div>
        </div>

        {/* account management & logout */}
        <div className="mt-8">
          <div style={{ marginBottom: 14 }}>
            {message && (
              <div className="text-sm mb-2">
                {message.type === 'success' && <span className="text-green-300">{message.text}</span>}
                {message.type === 'error' && <span className="text-red-300">{message.text}</span>}
                {message.type === 'info' && <span className="text-yellow-300">{message.text}</span>}
              </div>
            )}
            <div className="text-sm text-gray-400">Gestión de cuenta</div>
          </div>

          {/* botón más pequeño y separado visualmente */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="danger"
              onClick={handleSignOut}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              style={{ minWidth: 120, padding: '8px 12px' }}
            >
              ⎋ Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* editor inline */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/60 absolute inset-0" onClick={() => setEditing(false)} />
          <div className="bg-surface-dark rounded-lg p-8 shadow-lg z-10 w-full max-w-md" style={{ border: '1px solid rgba(255,255,255,0.03)' }}>
            <h3 className="text-lg font-bold mb-3">Editar perfil</h3>
            <label className="text-sm text-gray-300">Nombre público</label>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full mt-3 p-3 rounded bg-gray-800 text-white"
              aria-label="Nombre público"
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="ghost" onClick={() => setEditing(false)} style={{ padding: '10px 14px' }}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave} style={{ minWidth: 110, padding: '10px 14px' }} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
//
