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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc('get_user_categories', {
      p_user_id: user.id,
      p_type: type,
    });

    if (error) {
      console.error('Error fetching categories via rpc:', error);
    } else if (data) {
      const typedData = data as Category[];
      const uniqueCategories = Array.from(
        new Map(typedData.map((cat: Category) => [cat.name.trim().toLowerCase(), cat])).values()
      ) as Category[];
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

  const handleDeleteClick = async (categoryId: number) => {
    if (!user) return;

    // Verificar transacciones asociadas ANTES de mostrar el modal
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', categoryId);

    if (transactionsError) {
      console.error('Error checking transactions:', transactionsError);
      return;
    }

    setTransactionCount(transactions?.length || 0);
    setShowDeleteConfirm(categoryId);
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!user) return;

    setIsDeleting(true);
    try {
      console.log(`🗑️ Eliminando categoría: ${categoryName} (ID: ${categoryId})`);

      // Eliminar transacciones asociadas primero
      if (transactionCount > 0) {
        console.log('🗑️ Eliminando transacciones asociadas...');
        const { error: deleteTransactionsError } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('category_id', categoryId);

        if (deleteTransactionsError) {
          throw deleteTransactionsError;
        }
        console.log('✅ Transacciones eliminadas correctamente');
      }

      // Eliminar la categoría
      console.log('🗑️ Eliminando categoría...');
      const { error: deleteCategoryError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (deleteCategoryError) {
        throw deleteCategoryError;
      }

      console.log('✅ Categoría eliminada correctamente');

      // Actualizar UI
      await fetchCategories();
      
      // Si la categoría eliminada estaba seleccionada, limpiar selección
      if (selectedCategoryId === categoryId.toString()) {
        onCategorySelect('');
      }

      // Notificar a componentes padre para que actualicen
      if (onCategoriesUpdate) {
        onCategoriesUpdate();
      }

    } catch (error) {
      console.error('❌ Error eliminando categoría:', error);
      alert('Error al eliminar la categoría. Inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
      setTransactionCount(0);
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedCategoryId}
              onChange={(e) => onCategorySelect(e.target.value)}
              className="category-select"
              style={{ flex: 1 }}
            >
              <option value="">Seleccione una categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            {/* Botón de eliminar categoría */}
            {selectedCategoryId && (
              <button
                type="button"
                onClick={() => handleDeleteClick(parseInt(selectedCategoryId))}
                disabled={isDeleting}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: isDeleting ? 0.6 : 1
                }}
                title="Eliminar categoría seleccionada"
              >
                {isDeleting ? '⏳' : '🗑️'}
              </button>
            )}
          </div>
          
          <button onClick={() => setIsCreating(true)} className="add-category-btn">
            + Nueva categoría
          </button>

          {/* Modal de confirmación MEJORADO */}
          {showDeleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(2px)'
            }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '32px',
                borderRadius: '12px',
                maxWidth: '480px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid #e0e0e0'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    backgroundColor: '#fee2e2',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <span style={{ fontSize: '24px' }}>🗑️</span>
                  </div>
                  <h3 style={{ margin: 0, color: '#dc2626', fontSize: '20px', fontWeight: 'bold' }}>
                    Eliminar Categoría
                  </h3>
                </div>

                {/* Content */}
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#374151' }}>
                    ¿Estás seguro de que quieres eliminar la categoría{' '}
                    <strong>"{categories.find(c => c.id === showDeleteConfirm)?.name}"</strong>?
                  </p>

                  {transactionCount > 0 && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
                        <strong style={{ color: '#92400e' }}>¡Atención!</strong>
                      </div>
                      <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                        Esta categoría tiene <strong>{transactionCount} transacción{transactionCount !== 1 ? 'es' : ''}</strong> asociada{transactionCount !== 1 ? 's' : ''}. 
                        También se eliminar{transactionCount !== 1 ? 'án' : 'á'}.
                      </p>
                    </div>
                  )}

                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
                      <strong>Esta acción NO se puede deshacer.</strong>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(null);
                      setTransactionCount(0);
                    }}
                    disabled={isDeleting}
                    style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const category = categories.find(c => c.id === showDeleteConfirm);
                      if (category) {
                        handleDeleteCategory(category.id, category.name);
                      }
                    }}
                    disabled={isDeleting}
                    style={{
                      background: isDeleting ? '#fca5a5' : '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: isDeleting ? 0.7 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.backgroundColor = '#b91c1c';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.backgroundColor = '#dc2626';
                      }
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #fff',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        🗑️ Eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* CSS para la animación del spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}