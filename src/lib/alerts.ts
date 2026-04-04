import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { Alert } from '@/types/alert';

// Stored as subcollection: users/{userId}/alerts/{alertId}
const userAlerts = (userId: string) => collection(db, 'users', userId, 'alerts');
const alertDoc   = (userId: string, alertId: string) =>
  doc(db, 'users', userId, 'alerts', alertId);

export async function getAlerts(userId: string): Promise<Alert[]> {
  const snap = await getDocs(userAlerts(userId));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Alert));
  // Sort: pending first (by priority then date), done last
  const priority: Record<string, number> = { urgent: 0, warning: 1, info: 2 };
  return items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pd = (priority[a.priority] ?? 2) - (priority[b.priority] ?? 2);
    if (pd !== 0) return pd;
    return (a.date || '').localeCompare(b.date || '');
  });
}

export async function addAlert(
  userId: string,
  alert: Omit<Alert, 'id'>
): Promise<string> {
  const ref = await addDoc(userAlerts(userId), alert);
  return ref.id;
}

export async function updateAlert(
  userId: string,
  alertId: string,
  data: Partial<Omit<Alert, 'id'>>
): Promise<void> {
  await updateDoc(alertDoc(userId, alertId), data as Record<string, unknown>);
}

export async function deleteAlert(userId: string, alertId: string): Promise<void> {
  await deleteDoc(alertDoc(userId, alertId));
}

export async function completeAlert(userId: string, alertId: string): Promise<void> {
  await setDoc(
    alertDoc(userId, alertId),
    { done: true, doneAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function postponeAlert(
  userId: string,
  alertId: string,
  currentDate: string
): Promise<void> {
  const base = currentDate ? new Date(currentDate + 'T00:00:00') : new Date();
  base.setDate(base.getDate() + 7);
  const newDate = base.toISOString().split('T')[0];
  await setDoc(alertDoc(userId, alertId), { date: newDate }, { merge: true });
}

export async function snoozeAlert(
  userId: string,
  alertId: string,
  days: number
): Promise<void> {
  const until = new Date();
  until.setDate(until.getDate() + days);
  const snoozedUntil = until.toISOString().split('T')[0];
  await setDoc(alertDoc(userId, alertId), { snoozedUntil }, { merge: true });
}
