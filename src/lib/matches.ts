import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { Match } from '@/types/match';

const COLLECTION = 'matches';
const CONFIG_COLLECTION = 'userConfig';

export async function getMatches(userId: string): Promise<Match[]> {
  // No orderBy here — combining where() + orderBy() on different fields requires
  // a composite Firestore index. Sort client-side instead.
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Match));
  return docs.sort((a, b) => b.date.localeCompare(a.date));
}

export async function addMatch(match: Omit<Match, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), match);
  return docRef.id;
}

export async function updateMatch(id: string, data: Partial<Match>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteMatch(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getSavedCompetitions(userId: string): Promise<string[]> {
  const snap = await getDoc(doc(db, CONFIG_COLLECTION, userId));
  if (!snap.exists()) return [];
  return snap.data().savedCompetitions ?? [];
}

export async function persistSavedCompetitions(userId: string, list: string[]): Promise<void> {
  await setDoc(
    doc(db, CONFIG_COLLECTION, userId),
    { savedCompetitions: list, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}
