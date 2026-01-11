'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase-admin';
// getAuthenticatedUser ya no es necesario aquí, la autenticación se maneja en el cliente/layout
// import { getAuthenticatedUser } from './(auth)/get-authenticated-user'; 

import { 
  taxRecordSchema, 
  type TaxRecord, 
  economicLicenseSchema, 
  type EconomicLicense, 
  taxRecordWithIdSchema, 
  settingsSchema, 
  type Settings 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to serialize data
const serializeData = (data: any) => JSON.parse(JSON.stringify(data));

// QUITÉ getUserId porque dependía de getAuthenticatedUser que usa firebase-admin
// La UID del usuario se pasará ahora directamente a las funciones que la necesiten,
// o se obtendrá en el componente de cliente.

// --- Tax Records Actions ---
// Estas funciones ya no se usan, ya que la lógica se movió a los componentes de cliente
// con los hooks de Firestore para tener actualizaciones en tiempo real.
// Las dejo por si se necesitan para alguna operación masiva en el futuro, pero
// no son llamadas actualmente.

// --- Economic Licenses Actions ---
// Lo mismo que con Tax Records, la lógica se ha movido al cliente.

// --- Settings Actions ---

export async function getSettings(userId: string): Promise<Settings | null> {
  try {
    const settingsDocRef = db.doc(`users/${userId}/settings/general`);
    const settingsDoc = await settingsDocRef.get();

    if (!settingsDoc.exists) {
      return null;
    }
    const settingsData = settingsDoc.data();
    return serializeData({ id: settingsDoc.id, ...settingsData }) as Settings;
  } catch (error) {
    console.error("Error fetching settings: ", error);
    return null;
  }
}
