import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PrivateRoute from '../components/Auth/PrivateRoute'
import '@testing-library/jest-dom'

// Mock de Navigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => {
    mockNavigate(to)
    return <div data-testid="redirect">Redirecting to {to}</div>
  }
}))

// Mock del useAuth hook
const mockUseAuth = jest.fn()
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}))

const TestComponent = () => <div>Contenido protegido</div>

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <PrivateRoute>{children}</PrivateRoute>
  </BrowserRouter>
)

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('muestra loading cuando está cargando', () => {
    mockUseAuth.mockReturnValue({ 
      user: null, 
      loading: true 
    })
    
    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  test('muestra contenido cuando hay usuario autenticado', () => {
    mockUseAuth.mockReturnValue({ 
      user: { 
        id: '123',
        email: 'test@test.com'
      }, 
      loading: false 
    })
    
    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )
    
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  test('redirige a login cuando no hay usuario', () => {
    mockUseAuth.mockReturnValue({ 
      user: null, 
      loading: false 
    })
    
    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )
    
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(screen.getByTestId('redirect')).toBeInTheDocument()
  })

  test('no redirige mientras está cargando', () => {
    mockUseAuth.mockReturnValue({ 
      user: null, 
      loading: true 
    })
    
    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    )
    
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.queryByTestId('redirect')).not.toBeInTheDocument()
  })
})