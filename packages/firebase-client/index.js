/**
 * @sasya/firebase-client — Shared Firebase initialization
 * 
 * Single source of truth for Firebase SDK initialization.
 * All four apps import from here — no duplicate initialization.
 * 
 * SECURITY NOTE:
 * The Firebase web configuration values (apiKey, projectId, etc.) are NOT secrets.
 * They are intended to be included in client-side code.
 * Real security comes from:
 *   - Firebase Authentication (user identity)
 *   - Realtime Database Security Rules (server-enforced permissions)
 *   - Trusted server-side operations (for privileged actions)
 * 
 * Never include service-account keys, private keys, or
 * administrator credentials in frontend code.
 */

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

/**
 * Get or initialize the Firebase app.
 * Uses Vite-compatible environment variables.
 * 
 * @returns {Object|null} Firebase app instance, or null if not configured
 */
export async function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const config = getFirebaseConfig();
  if (!config) {
    console.info('[Firebase] No Firebase configuration found. Running in demo mode.');
    return null;
  }

  try {
    const { initializeApp } = await import('firebase/app');
    firebaseApp = initializeApp(config);
    console.info('[Firebase] App initialized:', config.projectId);
    return firebaseApp;
  } catch (err) {
    console.error('[Firebase] Failed to initialize:', err.message);
    return null;
  }
}

/**
 * Get Firebase Auth instance
 */
export async function getAuth() {
  if (firebaseAuth) return firebaseAuth;
  const app = await getFirebaseApp();
  if (!app) return null;

  const { getAuth: fbGetAuth } = await import('firebase/auth');
  firebaseAuth = fbGetAuth(app);
  return firebaseAuth;
}

/**
 * Get Firebase Realtime Database instance
 */
export async function getDatabase() {
  if (firebaseDb) return firebaseDb;
  const app = await getFirebaseApp();
  if (!app) return null;

  const { getDatabase: fbGetDb } = await import('firebase/database');
  firebaseDb = fbGetDb(app);
  return firebaseDb;
}

/**
 * Read Firebase config from Vite environment variables.
 * Returns null if not configured.
 */
function getFirebaseConfig() {
  // Vite exposes env vars with VITE_ prefix via import.meta.env
  const apiKey = import.meta.env?.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) return null;

  return {
    apiKey,
    authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
    projectId,
    storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env?.VITE_FIREBASE_APP_ID || '',
  };
}

/**
 * Check whether Firebase is configured
 */
export function isFirebaseConfigured() {
  return !!(import.meta.env?.VITE_FIREBASE_API_KEY && import.meta.env?.VITE_FIREBASE_PROJECT_ID);
}

/**
 * Get the current data mode
 */
export function getDataMode() {
  if (import.meta.env?.VITE_DATA_MODE === 'firebase' && isFirebaseConfigured()) {
    return 'firebase';
  }
  return 'demo';
}
