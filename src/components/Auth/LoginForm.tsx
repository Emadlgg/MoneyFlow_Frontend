import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginUser } from '../../services/auth.service';
import { AuthContext } from '../../contexts/AuthContext';
import '../../assets/style/login.css';

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
      const user = await loginUser(email, password);
      setUser(user);
      navigate('/transactions', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || 'Credenciales inválidas');
      } else {
        setError('Error al iniciar sesión');
      }
    }
  };

  return (
    <div className="login">
      <form onSubmit={handleSubmit} className="login__form">
        <h2 className="login__title">User Login</h2>

        {error && <p className="login__error">{error}</p>}

        <div className="login__content">
          <div className="login__box">
            <i className="login__icon">📧</i>
            <div className="login__box-input">
              <input
                className="login__input"
                type="email"
                placeholder=" "
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <label className="login__label">Email</label>
            </div>
          </div>

          <div className="login__box">
            <i className="login__icon">🔒</i>
            <div className="login__box-input">
              <input
                className="login__input"
                type="password"
                placeholder=" "
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label className="login__label">Contraseña</label>
            </div>
          </div>
        </div>

        <a href="#" className="login__forgot">Forgot Password?</a>

        <button type="submit" className="login__button">Entrar</button>

        <p className="login__register">
          ¿No tienes cuenta? <a href="#">Regístrate</a>
        </p>
      </form>
    </div>
  );
}