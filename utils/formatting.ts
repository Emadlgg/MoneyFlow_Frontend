export const formatDate = (date: Date | string, type: 'date' | 'time' | 'full' = 'date') => {
    const d = new Date(date);
    
    if (type === 'date') return d.toLocaleDateString();
    if (type === 'time') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return d.toLocaleString();
  };
  
  export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };