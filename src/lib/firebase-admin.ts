import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId   = process.env.FIREBASE_PROJECT_ID   ?? process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL  ?? process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Vercel stores private keys with escaped \n — restore real newlines
  const privateKey  = (process.env.FIREBASE_PRIVATE_KEY  ?? process.env.FIREBASE_ADMIN_PRIVATE_KEY)?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK: faltan variables de entorno ' +
        '(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)'
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
