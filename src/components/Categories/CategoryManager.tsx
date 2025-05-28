import React, { useState } from 'react'
import { useCategory } from '../../contexts/CategoryContext'

interface CategoryManagerProps {
  type: 'income' | 'expense'
  selectedCategory: string
  onCategorySelect: (category: string) => void
}

export default function CategoryManager({ type, selectedCategory, onCategorySelect }: CategoryManagerProps) {
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
    selectedCategory,
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
      <div className="category-selector">
        <label>Categoría</label>
        <div className="category-options">
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className={`category-option ${selectedCategory === category.name ? 'category-option--selected' : ''} ${category.is_default ? 'category-option--default' : ''}`}
              style={{ '--category-color': category.color } as React.CSSProperties}
              onClick={() => {
                console.log('🎯 Category selected:', category.name)
                onCategorySelect(category.name)
              }}
              title={category.is_default ? 'Categoría por defecto' : 'Categoría personalizada'}
            >
              <span className="category-color" style={{ backgroundColor: category.color }}></span>
              {category.name}
              {category.is_default && <span className="category-default-badge">★</span>}
            </button>
          ))}
          
          <button
            type="button"
            className="category-option category-option--add"
            onClick={() => {
              console.log('🎯 Add category button clicked')
              setIsCreating(true)
            }}
            disabled={isSubmitting}
          >
            + Nueva categoría
          </button>
        </div>
      </div>

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