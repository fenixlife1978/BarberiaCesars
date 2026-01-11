'use server';

import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

// This function should only be called from a trusted server environment.
export async function setSuperAdminClaim(uid: string) {
    if (!adminApp) {
        throw new Error("Admin SDK not initialized. Cannot set custom claims.");
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
