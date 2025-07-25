import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import './CategoryManager.css';

interface CategoryManagerProps {
  type: 'income' | 'expense';
  selectedCategoryId: string;
  onCategorySelect: (id: string) => void;
  onCategoriesUpdate?: () => void;
}

export default function CategoryManager({ type, selectedCategoryId, onCategorySelect, onCategoriesUpdate }: CategoryManagerProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(type === 'income' ? '#28a745' : '#e53e3e');

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    // --- INICIO DE LA CORRECCIÓN FINAL ---
    // Llamamos a la función de base de datos 'get_user_categories'
    const { data, error } = await supabase.rpc('get_user_categories', {
      p_user_id: user.id,
      p_type: type,
    });
    // --- FIN DE LA CORRECCIÓN FINAL ---

    if (error) {
      console.error('Error fetching categories via rpc:', error);
    } else if (data) {
      // Elimina duplicados por nombre (ignorando mayúsculas/minúsculas)
      const uniqueCategories = Array.from(
        new Map(data.map(cat => [cat.name.trim().toLowerCase(), cat])).values()
      );
      // Ordena alfabéticamente
      uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(uniqueCategories);
    }
  }, [user, type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async () => {
    if (!user || !newCategoryName.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim(), user_id: user.id, type: type, color: newCategoryColor })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
    } else if (data) {
      setNewCategoryName('');
      setNewCategoryColor(type === 'income' ? '#28a745' : '#e53e3e');
      setIsCreating(false);
      fetchCategories();
      onCategorySelect(data.id.toString());
    }
  };

  return (
    <div className="category-manager">
      {isCreating ? (
        <div className="create-category-form">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="new-category-input"
          />
          <input
            type="color"
            value={newCategoryColor}
            onChange={(e) => setNewCategoryColor(e.target.value)}
            className="new-category-color"
          />
          <div className="create-category-actions">
            <button onClick={handleCreateCategory} className="save-btn">Guardar</button>
            <button onClick={() => setIsCreating(false)} className="cancel-btn">Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="category-select-wrapper">
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategorySelect(e.target.value)}
            required
            className="category-select"
          >
            <option value="" disabled>Seleccione una categoría</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button onClick={() => setIsCreating(true)} className="add-category-btn">
            + Nueva categoría
          </button>
        </div>
      )}
    </div>
  );
}