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
      const { data } = await api.post<TipsResponse>('/tips/generate', userStats);
      return data;
    } catch (error: any) {
      console.error('Error fetching tips:', error);
      return {
        success: false,
        tips: [],
        error: error.response?.data?.error || 'Error al obtener consejos'
      };
    }
  }
};