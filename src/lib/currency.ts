// Current exchange rate (RD$ to USD)
// In a real application, this would be fetched from an API
const EXCHANGE_RATE = 56; // 1 USD = 56 RD$

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'USD' && toCurrency === 'RD$') {
    return amount * EXCHANGE_RATE;
  }
  
  if (fromCurrency === 'RD$' && toCurrency === 'USD') {
    return amount / EXCHANGE_RATE;
  }
  
  return amount;
};

export const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'USD') {
    return `USD $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getExchangeRate = (): number => {
  return EXCHANGE_RATE;
};
