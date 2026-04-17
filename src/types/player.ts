export type PlayerStatus = 'activo' | 'seguimiento' | 'espera' | 'descartado';
export type PlayerFoot = 'derecho' | 'izquierdo' | 'ambos';
export type PlayerPosition =
  | 'Portero'
  | 'Lateral Derecho'
  | 'Lateral Izquierdo'
  | 'Central'
  | 'Mediocentro Defensivo'
  | 'Mediocentro'
  | 'Mediocentro Ofensivo'
  | 'Extremo Derecho'
  | 'Extremo Izquierdo'
  | 'Delantero Centro'
  | 'Segunda Punta';

export interface ClubHistoryEntry {
  club: string;
  category: string;
  season: string;
  goals?: number;
  assists?: number;
}

export interface VideoLink {
  label: string;
  url: string;
}

export interface DetailedMetrics {
  technical: {
    passing: number;
    control: number;
    vision: number;
    dribbling: number;
    pressing: number;
  };
  tactical: {
    balance: number;
    transition: number;
    recovery: number;
    creation: number;
    highPress: number;
  };
  physical: {
    speed: number;
    resistance: number;
    strength: number;
    jump: number;
  };
  attitude: {
    leadership: number;
    competitiveness: number;
    coachability: number;
  };
}

export interface Player {
  id: string;
  name: string;
  birthDate: string;
  position: PlayerPosition;
  foot: PlayerFoot;
  height: number;
  weight: number;
  club: string;
  city: string;
  category: string;
  division: string;
  status: PlayerStatus;
  tags: string[];
  privateNotes: string;
  photo: string;
  photoBase64?: string;
  metrics: {
    technical: number;
    tactical: number;
    physical: number;
    attitude: number;
  };
  cvClubs?: Array<{ club: string; etapa: string; categoria: string }>;

  // ── Estadísticas de temporada ──────────────────────────────────────────
  goals?: number;
  assists?: number;
  matchesPlayed?: number;
  minutesPlayed?: number;
  yellowCards?: number;
  redCards?: number;
  saves?: number;          // Portero
  goalsConceded?: number;  // Portero

  // ── Contacto y entorno ────────────────────────────────────────────────
  contactName?: string;
  contactPhone?: string;
  contactRelation?: string;   // Padre, Madre, Representante, Otro
  agentName?: string;

  // ── Disponibilidad ────────────────────────────────────────────────────
  contractEnd?: string;                           // YYYY-MM-DD
  transferInterest?: 'si' | 'no' | 'desconocido';
  clauseAmount?: number;

  // ── Historial de clubes ───────────────────────────────────────────────
  clubHistory?: ClubHistoryEntry[];

  // ── Vídeos ───────────────────────────────────────────────────────────
  videoLinks?: VideoLink[];

  // ── Métricas detalladas ───────────────────────────────────────────────
  detailedMetrics?: DetailedMetrics;

  createdAt: string;
  updatedAt: string;
  userId: string;
}
