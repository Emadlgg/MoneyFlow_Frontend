import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginUser } from '../../services/auth.service';
import { AuthContext } from '../../contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);

  const { setUser } = useContext(AuthContext);
  const navigate    = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await loginUser(email, password);  // aquí ya no rompe
      setUser(user);
      navigate('/transactions', { replace: true });   // y navega correctamente
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || 'Credenciales inválidas');
      } else {
        setError('Error al iniciar sesión');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && <p className="error">{error}</p>}
      <div>
        <label>Email</label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Contraseña</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Entrar</button>
    </form>
  );
}
