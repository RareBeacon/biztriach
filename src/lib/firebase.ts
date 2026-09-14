/**
 * Firebase Admin SDK — Firestore + Auth + Storage
 * Initialized lazily from environment variables so builds never require creds.
 *
 * Required env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY        (the \n-escaped private key string)
 *   FIREBASE_STORAGE_BUCKET     (e.g. biztriach.appspot.com) — optional, Storage features degrade gracefully
 */
import admin from "firebase-admin";

const globalForFirebase = global as unknown as { firebaseApp?: admin.app.App };

function initApp(): admin.app.App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
  }

  // Fallback (e.g. local emulators or builds): initialize without creds.
  // Firestore/Auth calls will fail — callers should handle errors gracefully.
  if (!admin.apps.length) {
    return admin.initializeApp({
      projectId: projectId || "biztriach-dev",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  return admin.app();
}

export function firebaseApp(): admin.app.App {
  if (!globalForFirebase.firebaseApp) {
    globalForFirebase.firebaseApp = initApp();
  }
  return globalForFirebase.firebaseApp;
}

/** Firestore instance (shared). */
export function firestore(): admin.firestore.Firestore {
  return firebaseApp().firestore();
}

/** Firebase Auth instance (shared). */
export function firebaseAuth(): admin.auth.Auth {
  return firebaseApp().auth();
}

/** Firebase Storage bucket (shared) — null when not configured. */
export function storageBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return null;
  return firebaseApp().storage().bucket(bucketName);
}

export default admin;
