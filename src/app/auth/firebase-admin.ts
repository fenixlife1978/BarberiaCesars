import admin from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// IMPORTANT: The service account key is injected as a Base64 encoded environment variable.
// This is a secure way to handle credentials in serverless environments.
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64!, 'base64').toString('ascii')
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();

export const { verifyIdToken, createSessionCookie } = auth;
