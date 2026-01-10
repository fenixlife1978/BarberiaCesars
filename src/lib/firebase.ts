import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-9155034390-c4587",
  "appId": "1:500254308818:web:774dcae7bfc629100bb00b",
  "apiKey": "AIzaSyBw5pP6CF0M49vWv2ZzytIV-UQDcjw-5Tc",
  "authDomain": "studio-9155034390-c4587.firebaseapp.com",
  "storageBucket": "studio-9155034390-c4587.firebasestorage.app",
  "messagingSenderId": "500254308818"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
