import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';

// This file is intended for server-side logic (e.g., API routes, server functions).
// It should NOT be imported into client-side components.

let adminApp: App;

// The Firebase Admin SDK needs specific environment variables to be set:
// - GOOGLE_APPLICATION_CREDENTIALS (path to your service account JSON file)
// OR
// - FIREBASE_CONFIG (a JSON string of the service account config)
// In many hosting environments (like Cloud Run, Cloud Functions), this is handled automatically.
// For local development, you need to set up a service account.

try {
  if (!getApps().length) {
    // initializeApp will automatically look for credentials in the environment
    adminApp = initializeApp({
      credential: applicationDefault(),
    });
  } else {
    adminApp = getApps()[0];
  }
} catch(e: any) {
    // This error is expected if the environment isn't set up for Admin SDK.
    // It's not a critical failure unless a server-side function tries to use it.
    console.log("Firebase Admin SDK not initialized. This is okay for client-side rendering, but server functions requiring admin access will fail.");
    // @ts-ignore
    adminApp = null;
}

// We do not export 'db' from here to prevent accidental client-side imports.
// Server-side files should import getFirestore from 'firebase-admin/firestore'
// and pass the adminApp instance themselves.
export { adminApp };
