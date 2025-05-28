import React from 'react'
import { supabase } from '../../services/supabaseClient'

export default function GoogleLoginButton() {
  const handle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/incomes`
        }
      })
      
      if (error) {
        console.error('Error with Google login:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <button onClick={handle} className="google-login-button">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
           alt="Google"/>
      Iniciar con Google
    </button>
  )
}