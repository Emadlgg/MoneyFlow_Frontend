import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginForm from '../components/Auth/LoginForm'
import '@testing-library/jest-dom'


// Mocks
const mockSignIn = jest.fn()
const mockNavigate = jest.fn()

// Mock del AuthContext
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    signIn: mockSignIn,
    user: null,
    loading: false
  })
}))

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  )
}))

// Mock de supabase
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
    }
  }
}))

// Mock del componente GoogleLoginButton
jest.mock('../components/Auth/GoogleLoginButton', () => {
  return function MockGoogleLoginButton() {
    return <button>Iniciar con Google</button>
  }
})

const LoginWrapper = () => (
  <BrowserRouter>
    <LoginForm />
  </BrowserRouter>
)

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renderiza correctamente', () => {
    render(<LoginWrapper />)
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
    expect(screen.getByText('Entrar')).toBeInTheDocument()
    expect(screen.getByText('Iniciar con Google')).toBeInTheDocument()
  })

  test('permite ingresar email', () => {
    render(<LoginWrapper />)
    const emailInputs = screen.getAllByRole('textbox')
    const emailInput = emailInputs.find((input) => 
      (input as HTMLInputElement).type === 'email'
    ) as HTMLInputElement
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    expect(emailInput.value).toBe('test@test.com')
  })

  test('permite ingresar contraseña', () => {
    render(<LoginWrapper />)
    const passwordInput = screen.getByDisplayValue('') as HTMLInputElement
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    expect(passwordInput.value).toBe('password123')
  })

  test('llama signIn al enviar formulario', async () => {
    mockSignIn.mockResolvedValueOnce(undefined)
    render(<LoginWrapper />)
    
    const form = screen.getByRole('form') || screen.getByText('Entrar').closest('form')
    if (form) {
      fireEvent.submit(form)
    } else {
      const submitButton = screen.getByText('Entrar')
      fireEvent.click(submitButton)
    }
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })
  })

  test('navega después de login exitoso', async () => {
    mockSignIn.mockResolvedValueOnce(undefined)
    render(<LoginWrapper />)
    
    const submitButton = screen.getByText('Entrar')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/incomes')
    })
  })
})