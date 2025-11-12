import { useState, useCallback } from 'react';
import { transactionService } from '../services/transaction.service';
import { categoryService } from '../services/category.service';

interface SpendingAlert {
  categoryId: string;
  categoryName: string;
  limit: number;
  currentSpent: number;
  percentage: number;
}

export function useSpendingLimits(userId: string) {
  const [alerts, setAlerts] = useState<SpendingAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const checkSpendingLimits = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      console.log('🔍 === VERIFICANDO LÍMITES ===');
      console.log('👤 Usuario:', userId);
      
      // Obtener categorías con límites usando el backend
      const categories = await categoryService.getAll('expense');
      const categoriesWithLimit = categories.filter(cat => cat.spending_limit != null);

      console.log('📂 Categorías con límites:', categoriesWithLimit.length);

      if (categoriesWithLimit.length === 0) {
        console.log('❌ No hay categorías con límites');
        setAlerts([]);
        return;
      }

      // Calcular primer y último día del mes actual correctamente
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-11
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0); // Día 0 del siguiente mes = último día del mes actual
      
      const startDate = firstDay.toISOString().split('T')[0];  // YYYY-MM-DD
      const endDate = lastDay.toISOString().split('T')[0];     // YYYY-MM-DD
      
      const alertsToShow: SpendingAlert[] = [];

      for (const category of categoriesWithLimit) {
        // Obtener transacciones del mes actual para esta categoría usando el backend
        const transactions = await transactionService.getAll({
          type: 'expense',
          category_id: category.id,
          start_date: startDate,
          end_date: endDate
        });

        const totalSpent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const limit = category.spending_limit!;
        const percentage = (totalSpent / limit) * 100;

        console.log(`📊 ${category.name}: Q${totalSpent}/Q${limit} (${percentage.toFixed(1)}%)`);

        // Crear alerta si se supera el 80% del límite
        if (percentage >= 80) {
          const alert = {
            categoryId: category.id.toString(),
            categoryName: category.name,
            limit,
            currentSpent: totalSpent,
            percentage
          };
          alertsToShow.push(alert);
          console.log('🚨 ALERTA CREADA:', alert);
        }
      }

      console.log('🔔 Total de alertas a mostrar:', alertsToShow.length);
      setAlerts(alertsToShow);
      console.log('✅ Estado de alertas actualizado');
      
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    alerts,
    loading,
    checkSpendingLimits
  };
}