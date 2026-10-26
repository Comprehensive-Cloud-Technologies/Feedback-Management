export type TimeFrameType = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'single_date' | 'custom';

export interface TimeRangeOption {
  value: TimeFrameType;
  label: string;
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: 'all', label: 'Lifetime' },
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'By Year' },
  { value: 'single_date', label: 'Select Date' },
  { value: 'custom', label: 'Custom Range' },
];

/**
 * Validates a custom date range.
 * Returns null if valid, or an error message if invalid.
 */
export function validateCustomDateRange(startDate?: string, endDate?: string): string | null {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      return 'Start date cannot be after end date.';
    }
  }
  return null;
}

/**
 * Checks if a given timestamp falls within the specified time range criteria.
 * Matches exact semantics of the Branch Admin Dashboard reference implementation.
 */
export function matchesTimeRange(
  timestamp: string | number | Date | null | undefined,
  timeFrame: TimeFrameType,
  startDate?: string,
  endDate?: string,
  selectedYear?: number
): boolean {
  if (timeFrame === 'all') return true;
  if (!timestamp) return false;

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return false;

  const now = new Date();

  if (timeFrame === 'daily') {
    return date.toDateString() === now.toDateString();
  }

  if (timeFrame === 'weekly') {
    const diff = now.getTime() - date.getTime();
    return diff >= 0 && diff / (1000 * 3600 * 24) <= 7;
  }

  if (timeFrame === 'monthly') {
    const diff = now.getTime() - date.getTime();
    return diff >= 0 && diff / (1000 * 3600 * 24) <= 30;
  }

  if (timeFrame === 'yearly') {
    const targetYear = selectedYear ?? now.getFullYear();
    return date.getFullYear() === targetYear;
  }

  if (timeFrame === 'custom') {
    // If range is inverted, do not match any
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return false;
    }

    if (startDate) {
      const start = new Date(startDate);
      if (date < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }

    return true;
  }

  if (timeFrame === 'single_date') {
    if (!startDate) return true; // Show all if no date selected yet, matching Branch Admin
    const selectedDate = new Date(startDate);
    return date.toDateString() === selectedDate.toDateString();
  }

  return true;
}
