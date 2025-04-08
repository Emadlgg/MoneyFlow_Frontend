import { useState } from 'react';
import axios from 'axios';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email" 
        required 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Contraseña" 
        required 
      />
      <button type="submit">Registrarse</button>
    </form>
  );
}
