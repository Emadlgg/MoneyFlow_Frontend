// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/style/index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'  // <-- importar

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>       {/* <-- envolver aquí */}
      <App />
    </AuthProvider>
  </StrictMode>,
)
