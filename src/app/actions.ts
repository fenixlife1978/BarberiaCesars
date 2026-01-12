'use server';

import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

// This function should only be called from a trusted server environment.
export async function setSuperAdminClaim(uid: string) {
    if (!adminApp) {
        // En un entorno de desarrollo donde las credenciales de ADC no están configuradas,
        // adminApp será undefined. Esto es esperado.
        // No lanzamos un error aquí para no romper el flujo de registro en desarrollo.
        console.warn("Firebase Admin SDK not initialized. Cannot set custom claims. This is expected in local development if credentials are not set.");
        return;
    }
    const auth = getAuth(adminApp);
    try {
        await auth.setCustomUserClaims(uid, { role: 'super_admin' });
        console.log(`Successfully set 'super_admin' claim for user ${uid}`);
    } catch (error) {
        console.error(`Error setting custom claim for user ${uid}:`, error);
        throw new Error('Failed to set custom claim.');
    }
}
