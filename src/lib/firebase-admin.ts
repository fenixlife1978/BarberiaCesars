// La directiva 'server-only' asegura que este archivo nunca se filtre al navegador
import 'server-only';
import { initializeApp, getApps, App, getApp } from 'firebase-admin/app';

const projectId = "studio-9155034390-c4587";

let adminApp: App;

// Lógica de inicialización segura para el servidor (Node.js)
if (getApps().length === 0) {
    adminApp = initializeApp({
        projectId: projectId
    });
} else {
    adminApp = getApp();
}


export { adminApp };
