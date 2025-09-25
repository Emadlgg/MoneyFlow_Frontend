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

export default function FinancialTipsPage() {
  const { user } = useAuth();
  const { accounts } = useAccount();
  const { selectedAccountId } = useSelectedAccount();
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  const calculateUserStats = async () => {
    if (!user || !selectedAccountId) return null;

    try {
      // Obtener transacciones de los últimos 3 meses
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, category_id')
        .eq('user_id', user.id)
        .eq('account_id', selectedAccountId)
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = transactions.reduce((acc: any, t: Transaction) => {
        if (t.type === 'income') {
          acc.totalIncome += t.amount;
        } else {
          acc.totalExpenses += Math.abs(t.amount);
          if (t.category_id) {
            acc.expensesByCategory[t.category_id] = 
              (acc.expensesByCategory[t.category_id] || 0) + Math.abs(t.amount);
          }
        }
        return acc;
      }, {
        totalIncome: 0,
        totalExpenses: 0,
        expensesByCategory: {} as Record<string, number>
      });

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  };

  const generateTips = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userStats = await calculateUserStats();
      
      if (!userStats) {
        setError('No hay datos suficientes para generar consejos');
        return;
      }

      const result = await tipsService.generateTips(userStats);
      
      if (result.success) {
        setTips(result.tips);
      } else {
        setError(result.error || 'Error al generar consejos');
      }
    } catch (error) {
      console.error('Error generating tips:', error);
      setError('Error al generar consejos');
    } finally {
      setLoading(false);
    }
  }, [user, selectedAccountId, calculateUserStats]);

  useEffect(() => {
    if (user && selectedAccountId) {
      generateTips();
    }
  }, [user, selectedAccountId, generateTips]);

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
        <p>Consejos personalizados basados en tu actividad financiera</p>
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

      <div className="tips-grid">
        {tips.map((tip, index) => (
          <div key={index} className="tip-card">
            <div className="tip-icon">💡</div>
            <p className="tip-text">{tip.replace(/^\d+\.\s*/, '')}</p>
          </div>
        ))}
      </div>

      {tips.length === 0 && !loading && (
        <div className="no-tips">
          <p>Agrega algunas transacciones para obtener consejos personalizados</p>
        </div>
      )}
    </div>
  );
}

