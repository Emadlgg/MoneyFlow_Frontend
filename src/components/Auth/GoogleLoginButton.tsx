// src/components/Auth/GoogleLoginButton.tsx
import React from 'react'
import { supabase } from '../../services/supabaseClient'

export default function GoogleLoginButton() {
  const handle = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login'
      }
    })
  }

  return (
    <button onClick={handle} className="login__google-button">
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
           alt="Google"/>
      Iniciar con Google
    </button>
  )
}
