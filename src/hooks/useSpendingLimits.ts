import { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

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
      
      // Obtener categorías con límites
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, spending_limit')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .not('spending_limit', 'is', null);

      console.log('📂 Categorías encontradas:', categories);

      if (!categories || categories.length === 0) {
        console.log('❌ No hay categorías con límites');
        setAlerts([]);
        return;
      }

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const alertsToShow: SpendingAlert[] = [];

      for (const category of categories) {
        // Calcular gasto total del mes actual para esta categoría
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('category_id', category.id)
          .eq('type', 'expense')
          .gte('date', `${currentMonth}-01`)
          .lte('date', `${currentMonth}-31`);

        const totalSpent = transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
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
      console.log('📋 Alertas completas:', alertsToShow);
      
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