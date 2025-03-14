import { format, parseISO } from "date-fns"

/**
 * Normalizes a date to YYYY-MM-DD format in local timezone
 */
export function normalizeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "yyyy-MM-dd")
}

/**
 * Safely parses an ISO date string to a Date object
 */
export function safeParseISO(dateString: string): Date {
  try {
    return parseISO(dateString)
  } catch (error) {
    console.error("Error parsing date:", error)
    return new Date(dateString)
  }
}

/**
 * Debug utility to log date information
 */
export function debugDate(label: string, date: Date | string): void {
  const d = typeof date === "string" ? new Date(date) : date
  console.log(`[DEBUG] ${label}:`, {
    original: typeof date === "string" ? date : date.toISOString(),
    date: d,
    iso: d.toISOString(),
    localeString: d.toLocaleString(),
    normalized: format(d, "yyyy-MM-dd"),
    time: format(d, "HH:mm:ss"),
    timestamp: d.getTime(),
  })
}

