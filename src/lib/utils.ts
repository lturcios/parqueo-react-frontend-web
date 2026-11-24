import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Formats a date as YYYY-MM-DD in the browser's local time zone.
 * Date#toISOString uses UTC, which turns into the next day in the evening
 * for time zones behind UTC (e.g. after 18:00 in El Salvador, UTC-6).
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
