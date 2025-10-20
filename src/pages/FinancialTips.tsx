import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAccount } from '../contexts/AccountContext';
import { useSelectedAccount } from '../contexts/SelectedAccountContext';
import { tipsService } from '../services/tips.service';
import { supabase } from '../services/supabaseClient';

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category_id?: number;
}

interface UserStats {
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

export default function FinancialTipsPage() {
  const { user } = useAuth();
  const { accounts } = useAccount();
  const { selectedAccountId } = useSelectedAccount();
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  // ✅ Memoizar calculateUserStats con useCallback
  const calculateUserStats = useCallback(async (): Promise<UserStats | null> => {
    if (!user || !selectedAccountId) {
      console.log('❌ No user or selectedAccountId');
      return null;
    }

    try {
      console.log('📊 Calculando estadísticas para cuenta:', selectedAccountId);
      
      // Obtener transacciones de los últimos 3 meses
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, category_id')
        .eq('user_id', user.id)
        .eq('account_id', selectedAccountId)
        .gte('date', threeMonthsAgo);

      if (error) {
        console.error('❌ Error fetching transactions:', error);
        throw error;
      }

      console.log(`📦 Transacciones obtenidas: ${transactions?.length || 0}`);

      if (!transactions || transactions.length === 0) {
        console.warn('⚠️ No hay transacciones para analizar');
        return null;
      }

      const stats = transactions.reduce((acc, t: Transaction) => {
        if (t.type === 'income') {
          acc.totalIncome += Math.abs(t.amount);
        } else {
          acc.totalExpenses += Math.abs(t.amount);
          if (t.category_id) {
            const categoryKey = `cat_${t.category_id}`;
            acc.expensesByCategory[categoryKey] = 
              (acc.expensesByCategory[categoryKey] || 0) + Math.abs(t.amount);
          }
        }
        return acc;
      }, {
        totalIncome: 0,
        totalExpenses: 0,
        expensesByCategory: {} as Record<string, number>
      });

      console.log('✅ Estadísticas calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error calculating stats:', error);
      return null;
    }
  }, [user, selectedAccountId]); // ✅ Solo depende de user y selectedAccountId

  // ✅ Memoizar generateTips correctamente
  const generateTips = useCallback(async () => {
    console.log('🚀 Iniciando generación de tips...');
    setLoading(true);
    setError(null);
    
    try {
      const userStats = await calculateUserStats();
      
      if (!userStats) {
        setError('No hay datos suficientes para generar consejos. Agrega algunas transacciones primero.');
        setTips([]);
        return;
      }

      // Validar que hay datos
      if (userStats.totalIncome === 0 && userStats.totalExpenses === 0) {
        setError('No hay transacciones registradas en los últimos 3 meses');
        setTips([]);
        return;
      }

      console.log('📤 Enviando datos al backend:', userStats);
      
      const result = await tipsService.generateTips(userStats);
      
      console.log('📥 Respuesta del backend:', result);
      
      if (result.success && result.tips && result.tips.length > 0) {
        setTips(result.tips);
        setError(null);
      } else {
        setError(result.error || 'No se pudieron generar consejos');
        setTips(result.tips || []); // Mostrar tips de fallback si existen
      }
    } catch (error: any) {
      console.error('❌ Error generating tips:', error);
      setError(error.message || 'Error al generar consejos');
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, [calculateUserStats]); // ✅ Solo depende de calculateUserStats

  // ✅ useEffect con las dependencias correctas
  useEffect(() => {
    if (user && selectedAccountId) {
      console.log('🔄 useEffect triggered - Generando tips...');
      generateTips();
    } else {
      console.log('⏸️ Esperando user y selectedAccountId...');
      setTips([]);
      setError(null);
    }
  }, [user, selectedAccountId]); // ✅ NO incluir generateTips aquí para evitar loop

  if (!selectedAccount) {
    return (
      <div className="financial-tips-page">
        <div className="no-account-selected">
          <h2>No hay cuenta seleccionada</h2>
          <p>Selecciona una cuenta para ver consejos financieros personalizados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-tips-page">
      <div className="tips-header">
        <h1>💡 Consejos Financieros</h1>
        <p>Consejos personalizados basados en tu actividad financiera de los últimos 3 meses</p>
        <button 
          onClick={generateTips} 
          disabled={loading}
          className="refresh-tips-btn"
        >
          {loading ? '🔄 Generando...' : '🔄 Actualizar Consejos'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {tips.length > 0 && (
        <div className="tips-grid">
          {tips.map((tip, index) => (
            <div key={index} className="tip-card">
              <div className="tip-icon">💡</div>
              <p className="tip-text">{tip.replace(/^\d+\.\s*/, '')}</p>
            </div>
          ))}
        </div>
      )}

      {tips.length === 0 && !loading && !error && (
        <div className="no-tips">
          <p>Agrega algunas transacciones para obtener consejos personalizados</p>
        </div>
      )}

      {loading && (
        <div className="loading-tips">
          <div className="spinner"></div>
          <p>Generando consejos personalizados con IA...</p>
        </div>
      )}
    </div>
  );
}