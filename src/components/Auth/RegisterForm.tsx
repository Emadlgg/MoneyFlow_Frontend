import { useState } from 'react';
import axios from 'axios';
import '../../assets/style/login.css';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {

      await axios.post('http://localhost:3000/api/auth/register', { email, password });
      alert('¡Registro exitoso!');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Error en registro:', error);
      alert('Error al registrar');
    }
  };

  return (
    <div className="login">
      <form onSubmit={handleSubmit} className="login__form">
        <h2 className="login__title">Register</h2>

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

        <button type="submit" className="login__button">Entrar</button>

        <p className="login__register">
          ¿Ya tienes una cuenta? <a href="#">Login</a>
        </p>
      </form>
    </div>
  );
}
