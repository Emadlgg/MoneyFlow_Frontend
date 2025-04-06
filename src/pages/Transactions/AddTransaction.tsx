import { useState } from 'react';
import axios from 'axios';

export default function AddTransaction() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/transactions', { amount, category });
      alert('Transacción guardada!');
    } catch {
      alert('Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
        placeholder="Monto" 
        required 
      />
      <input 
        type="text" 
        value={category} 
        onChange={(e) => setCategory(e.target.value)} 
        placeholder="Categoría" 
        required 
      />
      <button type="submit">Guardar</button>
    </form>
  );
}