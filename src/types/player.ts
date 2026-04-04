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
  metrics: {
    technical: number;
    tactical: number;
    physical: number;
    attitude: number;
  };
  cvClubs?: Array<{ club: string; etapa: string; categoria: string }>;
  createdAt: string;
  updatedAt: string;
  userId: string;
}
