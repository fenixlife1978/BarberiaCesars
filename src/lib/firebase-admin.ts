import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config(); // Carga las variables de entorno desde .env

let adminApp: App;

// Las variables de entorno para la configuración de Admin SDK
// (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
// son leídas automáticamente por `applicationDefault()` en muchos entornos.
// Si se ejecuta localmente, se deben tener seteadas en el entorno o en el .env

try {
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: applicationDefault(),
    });
  } else {
    adminApp = getApps()[0];
  }
} catch(e: any) {
    console.error("Error inicializando Firebase Admin SDK. Asegúrate de que las variables de entorno FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY están configuradas.", e.message);
    // En un caso real, podrías querer que la app falle si el SDK de admin es crucial.
    // Para este contexto, la dejamos en un estado no inicializado si falla.
    // @ts-ignore
    adminApp = null;
}


const db = adminApp ? getFirestore(adminApp) : null;

export { adminApp, db };
