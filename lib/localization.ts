const PHP_LOCALE = "en-PH";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(PHP_LOCALE, { style: "currency", currency: "PHP", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
};

export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat(PHP_LOCALE).format(value);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(PHP_LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
};

export const formatDateLong = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(PHP_LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(d);
};
