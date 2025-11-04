import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAccount } from "../contexts/AccountContext";
import { useSelectedAccount } from "../contexts/SelectedAccountContext";
import { tipsService, UserStats } from "../services/tips.service";
import { transactionService } from "../services/transaction.service";
import "./financial-tips.css";

interface Transaction {
  amount: number;
  type: "income" | "expense";
  category_id?: number;
  date?: string;
}

export default function FinancialTipsPage(): JSX.Element {
  const { user } = useAuth();
  const { accounts } = useAccount();
  const { selectedAccountId } = useSelectedAccount();

  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  // 📊 Calcular estadísticas del usuario
  const calculateUserStats = useCallback(async (): Promise<UserStats | null> => {
    if (!user || !selectedAccountId) return null;

    try {
      const threeMonthsAgo = new Date(
        Date.now() - 90 * 24 * 60 * 60 * 1000
      ).toISOString();

      const transactions = await transactionService.getAll({ 
        account_id: parseInt(selectedAccountId) 
      });

      if (!transactions || transactions.length === 0) return null;

      // Filtrar transacciones de los últimos 3 meses
      const recentTransactions = transactions.filter(t => 
        new Date(t.date) >= new Date(threeMonthsAgo)
      );

      if (recentTransactions.length === 0) return null;

      const stats: UserStats = recentTransactions.reduce(
        (acc, t) => {
          const amount = Math.abs(t.amount);
          if (t.type === "income") {
            acc.totalIncome += amount;
          } else {
            acc.totalExpenses += amount;
            if (t.category_id) {
              const key = `cat_${t.category_id}`;
              acc.expensesByCategory[key] =
                (acc.expensesByCategory[key] || 0) + amount;
            }
          }
          return acc;
        },
        {
          totalIncome: 0,
          totalExpenses: 0,
          expensesByCategory: {},
        } as UserStats
      );

      return stats;
    } catch (err) {
      console.error("❌ Error calculando estadísticas:", err);
      return null;
    }
  }, [user, selectedAccountId]);

  // 🤖 Generar tips con IA
  const generateTips = async () => {
    if (loading) {
      console.log("⏭️ Ya hay una generación en progreso, saltando...");
      return;
    }

    console.log("🚀 Iniciando generación de tips...");
    setLoading(true);
    setError(null);

    try {
      console.log("📊 Calculando estadísticas...");
      const stats = await calculateUserStats();
      
      if (!stats) {
        console.warn("⚠️ No hay estadísticas disponibles");
        setError("No hay datos suficientes en los últimos 3 meses.");
        setTips([]);
        setLoading(false);
        setHasLoadedOnce(true);
        return;
      }

      console.log("📈 Estadísticas calculadas:", {
        totalIncome: stats.totalIncome,
        totalExpenses: stats.totalExpenses,
        categories: Object.keys(stats.expensesByCategory).length
      });

      console.log("🤖 Llamando a la IA...");
      const result = await tipsService.generateTips(stats);
      console.log("✅ Respuesta de la IA:", result);

      if (result.success && result.tips?.length) {
        console.log(`✅ ${result.tips.length} consejos generados`);
        setTips(result.tips);
        setError(null);
      } else {
        console.error("❌ Error en respuesta:", result.error);
        setError(result.error || "No se pudieron generar consejos.");
        setTips([]);
      }
    } catch (err: any) {
      console.error("❌ Error generando tips:", err);
      console.error("❌ Error completo:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.error || err.message || "Error inesperado al generar consejos.");
      setTips([]);
    } finally {
      console.log("🏁 Generación finalizada");
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  // ⏱️ Ejecutar una sola vez cuando se monta el componente
  useEffect(() => {
    if (user && selectedAccountId && !hasLoadedOnce) {
      generateTips();
    }
  }, [user, selectedAccountId, hasLoadedOnce]);

  if (!selectedAccount) {
    return (
      <div className="financial-tips-page">
        <h2>No hay cuenta seleccionada</h2>
        <p>Selecciona una cuenta para ver consejos financieros.</p>
      </div>
    );
  }

  return (
    <div className="financial-tips-page">
      <div className="tips-header">
        <h1>💡 Consejos Financieros</h1>
        <p>Basados en tu actividad de los últimos 3 meses</p>
        <button onClick={generateTips} disabled={loading}>
          {loading ? "🔄 Generando..." : "🔄 Actualizar Consejos"}
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {!loading && tips.length > 0 && (
        <div className="tips-grid">
          {tips.map((tip, i) => (
            <div key={i} className="tip-card">
              <span>💡</span>
              <p>{tip.replace(/^\d+\.\s*/, "")}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && tips.length === 0 && hasLoadedOnce && !error && (
        <p>Agrega transacciones para obtener consejos personalizados.</p>
      )}

      {loading && (
        <div className="loading-tips">
          <div className="spinner"></div>
          <p>Generando consejos con IA...</p>
        </div>
      )}
    </div>
  );
}
