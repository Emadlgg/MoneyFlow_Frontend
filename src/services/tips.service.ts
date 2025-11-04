// services/tips.service.ts
import api from "./api";

export interface UserStats {
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

export interface TipsResponse {
  success: boolean;
  tips?: string[];
  error?: string;
}

export const tipsService = {
  async generateTips(stats: UserStats): Promise<TipsResponse> {
    try {
      console.log("📡 Enviando petición a /tips/generate con stats:", stats);
      const response = await api.post("/tips/generate", stats);
      console.log("📡 Respuesta recibida:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error al generar tips:", error);
      console.error("❌ Detalles del error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.message ||
          "Error desconocido al generar los consejos.",
      };
    }
  },
};
