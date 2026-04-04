import { db } from './firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { Visit, SharedReport } from '@/types/visit';

const PLAYERS_COL = 'players';
const SHARED_COL  = 'shared-reports';

// ─── Visits (subcollection: players/{playerId}/visits) ─────────────────────

export async function getVisits(playerId: string): Promise<Visit[]> {
  const snap = await getDocs(collection(db, PLAYERS_COL, playerId, 'visits'));
  const visits = snap.docs.map(d => ({ id: d.id, ...d.data() } as Visit));
  // Sort by fecha desc client-side — avoids composite index requirement
  return visits.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function addVisit(
  playerId: string,
  visit: Omit<Visit, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, PLAYERS_COL, playerId, 'visits'),
    visit
  );
  return ref.id;
}

export async function deleteVisit(
  playerId: string,
  visitId: string
): Promise<void> {
  await deleteDoc(doc(db, PLAYERS_COL, playerId, 'visits', visitId));
}

// ─── Shared reports ──────────────────────────────────────────────────────────

export async function saveSharedReport(
  data: Omit<SharedReport, 'id'>
): Promise<string> {
  const reportId =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await setDoc(doc(db, SHARED_COL, reportId), data);
  return reportId;
}

export async function getSharedReport(
  reportId: string
): Promise<SharedReport | null> {
  const snap = await getDoc(doc(db, SHARED_COL, reportId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SharedReport;
}
