import { initializeApp, getApps, App, applicationDefault, getApp } from 'firebase-admin/app';

let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: applicationDefault(),
  });
} else {
  adminApp = getApp();
}

export { adminApp };
