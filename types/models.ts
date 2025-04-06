export interface Transaction {
    id?: number;
    amount: number;
    category: string;
    date?: Date | string;
    createdAt?: Date | string;
  }
  
  export interface User {
    email: string;
    password: string;
  }
  
  export interface ApiError {
    message?: string;
    details?: Record<string, string>;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  }