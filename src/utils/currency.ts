export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  EUR: '€',
  USD: '$',
  GBP: '£',
  SGD: 'S$'
};

/**
 * Formats a number into Indian Rupee format (Lakhs & Crores)
 * e.g., 148750.5 -> "₹ 1,48,750.50"
 */
export const formatINR = (amount: number, showDecimals: boolean = true): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);

  return formatted;
};

/**
 * Formats date into standard Indian/Global display format
 */
export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
