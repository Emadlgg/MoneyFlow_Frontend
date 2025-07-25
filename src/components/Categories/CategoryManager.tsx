import React, { useState } from 'react'
import { useCategory } from '../../contexts/CategoryContext'

interface CategoryManagerProps {
  type: 'income' | 'expense';
  selectedCategoryId: string; // Changed from selectedCategory
  onCategorySelect: (id: string) => void;
  onCategoriesUpdate?: () => void;
}

export default function CategoryManager({ 
  type, 
  selectedCategoryId, // Changed from selectedCategory
  onCategorySelect,
  onCategoriesUpdate 
}: CategoryManagerProps) {
  const { incomeCategories, expenseCategories, createCategory } = useCategory()
  const [isCreating, setIsCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#333333')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const colors = [
    '#dc3545', '#28a745', '#007bff', '#ffc107', '#6f42c1',
    '#e83e8c', '#fd7e14', '#20c997', '#17a2b8', '#6c757d'
  ]

  // Debug log
  console.log('🎯 CategoryManager render:', { 
    type, 
    categoriesCount: categories.length, 
    selectedCategoryId,
    isCreating 
  })

  const handleCreateCategory = async () => {
    console.log('🎯 handleCreateCategory called with:', { newCategoryName, type, newCategoryColor })
    setError('')
    
    if (!newCategoryName.trim()) {
      setError('El nombre de la categoría es requerido')
      console.log('❌ Empty category name')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('🎯 CategoryManager: About to call createCategory...')
      
      await createCategory(newCategoryName.trim(), type, newCategoryColor)
      
      console.log('🎯 CategoryManager: Category created successfully')
      setNewCategoryName('')
      setNewCategoryColor('#333333')
      setIsCreating(false)
      if (onCategoriesUpdate) onCategoriesUpdate() // Notify parent component
    } catch (error: any) {
      console.error('🎯 CategoryManager: Error creating category:', error)
      setError(error.message || 'Error al crear la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setNewCategoryName('')
    setNewCategoryColor('#333333')
    setError('')
  }

  return (
    <div className="category-manager">
      <div className="form-group">
        <label>Categoría</label>
        <div className="category-select-wrapper">
          <select
            value={selectedCategoryId} // Changed from selectedCategory
            onChange={(e) => onCategorySelect(e.target.value)}
            disabled={isCreating || categories.length === 0}
            required
          >
            <option value="">Seleccione una categoría</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setIsCreating(true)}
        disabled={isSubmitting}
      >
        + Nueva categoría
      </button>

      {isCreating && (
        <div className="category-creator">
          <h4>Crear nueva categoría ({type === 'income' ? 'Ingreso' : 'Gasto'})</h4>
          <div className="category-form">
            {error && (
              <div className="category-error">
                {error}
              </div>
            )}
            
            <div className="category-form-group">
              <input
                type="text"
                placeholder="Nombre de la categoría"
                value={newCategoryName}
                onChange={(e) => {
                  console.log('🎯 Category name changed:', e.target.value)
                  setNewCategoryName(e.target.value)
                }}
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    console.log('🎯 Enter pressed, calling handleCreateCategory')
                    e.preventDefault()
                    handleCreateCategory()
                  }
                }}
              />
              
              <div className="color-picker">
                <span className="color-picker-label">Color:</span>
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${newCategoryColor === color ? 'color-option--selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      console.log('🎯 Color selected:', color)
                      setNewCategoryColor(color)
                    }}
                    title={color}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>
            
            <div className="category-form-actions">
              <button
                type="button"
                className="category-btn category-btn--cancel"
                onClick={(e) => {
                  console.log('🎯 Cancel button clicked')
                  e.preventDefault()
                  e.stopPropagation()
                  handleCancel()
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="category-btn category-btn--create"
                onClick={(e) => {
                  console.log('🎯 Create button clicked!')
                  e.preventDefault()
                  e.stopPropagation()
                  handleCreateCategory()
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}