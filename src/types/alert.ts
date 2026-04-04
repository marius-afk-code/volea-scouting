export type AlertPriority = 'urgent' | 'warning' | 'info';

export interface Alert {
  id: string;
  playerId: string;       // associated player ID (may be empty string)
  date: string;           // YYYY-MM-DD deadline
  message: string;
  priority: AlertPriority;
  done: boolean;
  doneAt?: string;        // ISO timestamp when completed
  snoozedUntil?: string;  // YYYY-MM-DD, hide until this date
  createdAt: string;      // ISO timestamp
}
