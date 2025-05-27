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
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
           alt="Google"/>
      Iniciar con Google
    </button>
  )
}
