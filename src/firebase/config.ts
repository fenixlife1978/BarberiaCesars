import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
    projectId: "studio-9155034390-c4587",
    appId: "1:500254308818:web:774dcae7bfc629100bb00b",
    apiKey: "AIzaSyBw5pP6CF0M49vWv2ZzytIV-UQDcjw-5Tc",
    authDomain: "studio-9155034390-c4587.firebaseapp.com",
    storageBucket: "studio-9155034390-c4587.firebasestorage.app",
    messagingSenderId: "500254308818"
};

// Inicialización para el navegador
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);