export type MatchCategory =
  | 'Profesional'
  | 'División de Honor'
  | 'Nacional'
  | 'Regional'
  | 'Juvenil'
  | 'Cadete'
  | 'Infantil'
  | 'Alevín'
  | 'Internacional'
  | '';

export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  competition: string;
  category: MatchCategory;
  homeTeam: string;
  awayTeam: string;
  result: string;
  venue: string;
  notes: string;
  linkedPlayers: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}
