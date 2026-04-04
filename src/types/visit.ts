export interface Visit {
  id: string;
  fecha: string;      // YYYY-MM-DD
  partido: string;    // match description e.g. "Cadete Lorca vs Cartagena J12"
  nota: string;       // scout observations
  valoracion: number; // 1–10
  createdAt: string;
}

export interface SharedReport {
  id?: string;
  // Player snapshot
  playerName: string;
  playerPosition: string;
  playerClub: string;
  playerCity: string;
  playerCategory: string;
  playerDivision: string;
  playerBirthDate: string;
  playerFoot: string;
  playerHeight: number;
  playerWeight: number;
  playerStatus: string;
  playerTags: string[];
  // Metrics
  metrics: {
    technical: number;
    tactical: number;
    physical: number;
    attitude: number;
  };
  // Visits snapshot (last 5)
  visits: Array<{
    fecha: string;
    partido: string;
    nota: string;
    valoracion: number;
  }>;
  // Analysis
  analysis: string;
  // Meta
  sharedAt: string;
  sharedBy: string;
}
