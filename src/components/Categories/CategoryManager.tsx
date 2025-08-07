import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import './CategoryManager.css';

interface Category {
  id: number;
  name: string;
}

interface CategoryManagerProps {
  type: 'income' | 'expense';
  selectedCategoryId: string;
  onCategorySelect: (id: string) => void;
  onCategoriesUpdate?: () => void;
}

export default function CategoryManager({ type, selectedCategoryId, onCategorySelect, onCategoriesUpdate }: CategoryManagerProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(type === 'income' ? '#28a745' : '#e53e3e');
  const [spendingLimit, setSpendingLimit] = useState('');

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
      // Tipamos explícitamente los datos de la RPC
      const typedData = data as Category[];
      
      // Elimina duplicados por nombre (ignorando mayúsculas/minúsculas)
      const uniqueCategories = Array.from(
        new Map(typedData.map((cat: Category) => [cat.name.trim().toLowerCase(), cat])).values()
      ) as Category[];
      
      // Ordena alfabéticamente
      uniqueCategories.sort((a: Category, b: Category) => a.name.localeCompare(b.name));
      setCategories(uniqueCategories);
    }
  }, [user, type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = async () => {
    if (!user || !newCategoryName.trim()) return;

    const categoryData = {
      name: newCategoryName.trim(),
      user_id: user.id,
      type: type,
      color: newCategoryColor,
      // Solo agregar límite si es una categoría de gastos y se especificó un valor
      ...(type === 'expense' && spendingLimit ? { 
        spending_limit: parseFloat(spendingLimit) 
      } : {})
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
    } else if (data) {
      setNewCategoryName('');
      setNewCategoryColor(type === 'income' ? '#28a745' : '#e53e3e');
      setSpendingLimit('');
      setIsCreating(false);
      await fetchCategories();
      if (onCategoriesUpdate) {
        onCategoriesUpdate();
      }
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
          
          {/* Campo de límite solo para categorías de gastos */}
          {type === 'expense' && (
            <div className="spending-limit-field">
              <input
                type="number"
                step="0.01"
                min="0"
                value={spendingLimit}
                onChange={(e) => setSpendingLimit(e.target.value)}
                placeholder="Límite mensual (opcional)"
                className="spending-limit-input"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginTop: '8px'
                }}
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Recibirás una notificación al superar el 80% del límite
              </small>
            </div>
          )}
          
          <div className="create-category-actions">
            <button onClick={handleCreateCategory} className="save-btn">Guardar</button>
            <button onClick={() => {
              setIsCreating(false);
              setSpendingLimit('');
            }} className="cancel-btn">Cancelar</button>
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