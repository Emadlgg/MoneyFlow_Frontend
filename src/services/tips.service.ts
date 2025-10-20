import api from './api';

interface UserStats {
  totalIncome: number;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
}

interface TipsResponse {
  success: boolean;
  tips: string[];
  error?: string;
}

export const tipsService = {
  async generateTips(userStats: UserStats): Promise<TipsResponse> {
    try {
      console.log('📤 [TipsService] Generando tips con datos:', userStats);
      
      // ✅ SIN /api porque ya está en baseURL
      const { data } = await api.post<TipsResponse>('/tips/generate', userStats);
      
      console.log('✅ [TipsService] Tips recibidos:', data);
      
      return data;
    } catch (error: any) {
      console.error('❌ [TipsService] Error:', error);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      return {
        success: false,
        tips: [],
        error: error.response?.data?.error || error.message || 'Error al obtener consejos'
      };
    }
  }
};