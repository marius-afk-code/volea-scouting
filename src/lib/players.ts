import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { Player } from '@/types/player';

const COLLECTION = 'players';

export async function getPlayers(userId: string): Promise<Player[]> {
  // No orderBy — combining where('userId') + orderBy('createdAt') on different
  // fields requires a composite Firestore index. Sort client-side instead.
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Player));
  return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addPlayer(player: Omit<Player, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), player);
  return docRef.id;
}

export async function updatePlayer(id: string, data: Partial<Player>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deletePlayer(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getPlayer(id: string): Promise<Player | null> {
  const docSnap = await getDoc(doc(db, COLLECTION, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Player;
}
