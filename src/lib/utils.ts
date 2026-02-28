import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat, formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// São Paulo timezone (GMT-3)
export const SAO_PAULO_TIMEZONE = "America/Sao_Paulo";

/**
 * Format a date in São Paulo timezone
 * @param date - Date to format (string, Date, or number)
 * @param formatStr - date-fns format string
 * @returns Formatted date string in São Paulo timezone
 */
export function formatInSaoPaulo(
  date: Date | string | number,
  formatStr: string = "dd/MM/yyyy HH:mm"
): string {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;
  
  return formatInTimeZone(dateObj, SAO_PAULO_TIMEZONE, formatStr, { locale: ptBR });
}

/**
 * Get current date/time in São Paulo timezone
 * @returns Current date in São Paulo
 */
export function nowInSaoPaulo(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: SAO_PAULO_TIMEZONE })
  );
}

/**
 * Convert a local date to São Paulo timezone ISO string
 * @param date - Date to convert
 * @returns ISO string adjusted for São Paulo timezone
 */
export function toSaoPauloISO(date: Date): string {
  return formatInTimeZone(date, SAO_PAULO_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Parse a "YYYY-MM-DD" date string as a local date (not UTC).
 * Avoids the timezone offset issue where new Date("2024-11-14") 
 * is interpreted as UTC midnight, shifting the day in GMT-3.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
