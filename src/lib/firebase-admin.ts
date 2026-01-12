import { initializeApp, getApps, App, applicationDefault, getApp } from 'firebase-admin/app';

let adminApp: App;

if (process.env.NODE_ENV === 'production') {
    if (getApps().length === 0) {
        adminApp = initializeApp({
            credential: applicationDefault(),
        });
    } else {
        adminApp = getApp();
    }
} else {
    // En desarrollo, es posible que las credenciales no estén disponibles.
    // La acción de servidor que lo usa se protegerá contra esto.
    if (getApps().length > 0) {
        adminApp = getApp();
    }
}


export { adminApp };
