
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from './(auth)/get-authenticated-user';

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

// Helper to get user ID
async function getUserId() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Usuario no autenticado.');
  }
  return user.uid;
}

// --- Tax Records Actions ---

export async function getTaxRecords(): Promise<TaxRecord[]> {
  const userId = await getUserId();
  try {
    const recordsCollection = db.collection(`users/${userId}/taxRecords`);
    const q = recordsCollection.orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return serializeData(records) as TaxRecord[];
  } catch (error) {
    console.error("Error fetching tax records: ", error);
    return [];
  }
}

export async function addTaxRecord(prevState: any, formData: FormData) {
  const userId = await getUserId();
  const settledMonths = formData.getAll('settledMonths') as string[];
  const documents = formData.getAll('documents').map(d => d.toString());
  
  const rawFormData = {
    paymentDate: formData.get('paymentDate'),
    description: formData.get('description'),
    receiptNumber: formData.get('receiptNumber'),
    amountBolivares: formData.get('amountBolivares'),
    bcvRate: formData.get('bcvRate'),
    amountEuros: formData.get('amountEuros'),
    settledMonths: settledMonths,
    documents: documents.length > 0 ? documents : undefined,
  };

  const validatedFields = taxRecordSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos. No se pudo agregar el registro.',
      status: 'error',
    };
  }
  
  const { amountBolivares, bcvRate, ...rest } = validatedFields.data;
  const calculatedAmountEuros = parseFloat((amountBolivares / bcvRate).toFixed(2));

  try {
    const recordsCollection = db.collection(`users/${userId}/taxRecords`);
    await recordsCollection.add({
      ...rest,
      amountBolivares,
      bcvRate,
      amountEuros: calculatedAmountEuros,
      createdAt: FieldValue.serverTimestamp(),
      userId: userId,
    });
    
    revalidatePath('/impuestos');
    return { message: 'Registro de impuesto agregado con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { message: 'Error al agregar el registro.', status: 'error' };
  }
}

export async function updateTaxRecord(prevState: any, formData: FormData) {
  const userId = await getUserId();
  const settledMonths = formData.getAll('settledMonths') as string[];
  const documents = formData.getAll('documents').map(d => d.toString());
  
  const rawFormData = {
    id: formData.get('id'),
    paymentDate: formData.get('paymentDate'),
    description: formData.get('description'),
    receiptNumber: formData.get('receiptNumber'),
    amountBolivares: formData.get('amountBolivares'),
    bcvRate: formData.get('bcvRate'),
    amountEuros: formData.get('amountEuros'),
    settledMonths: settledMonths,
    documents: documents.length > 0 ? documents : [],
  };

  const validatedFields = taxRecordWithIdSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos. No se pudo actualizar el registro.',
      status: 'error',
    };
  }
  
  const { id, amountBolivares, bcvRate, ...rest } = validatedFields.data;
  const calculatedAmountEuros = parseFloat((amountBolivares / bcvRate).toFixed(2));
  
  try {
    const recordRef = db.doc(`users/${userId}/taxRecords/${id}`);
    await recordRef.update({
      ...rest,
      amountBolivares,
      bcvRate,
      amountEuros: calculatedAmountEuros,
    });
    revalidatePath('/impuestos');
    return { message: 'Registro de impuesto actualizado con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error updating document: ", error);
    return { message: 'Error al actualizar el registro.', status: 'error' };
  }
}

export async function deleteTaxRecord(id: string) {
    const userId = await getUserId();
    try {
        const recordRef = db.doc(`users/${userId}/taxRecords/${id}`);
        await recordRef.delete();
        revalidatePath('/impuestos');
        return { message: 'Registro eliminado con éxito.', status: 'success' };
    } catch (error) {
        console.error("Error deleting document: ", error);
        return { message: 'Error al eliminar el registro.', status: 'error' };
    }
}

// --- Economic Licenses Actions ---

export async function getEconomicLicenses(): Promise<EconomicLicense[]> {
  const userId = await getUserId();
  try {
    const licensesCollection = db.collection(`users/${userId}/economicLicenses`);
    const q = licensesCollection.orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    const licenses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return serializeData(licenses) as EconomicLicense[];
  } catch (error) {
    console.error("Error fetching economic licenses: ", error);
    return [];
  }
}

export async function addEconomicLicense(prevState: any, formData: FormData) {
  const userId = await getUserId();
  const rawData = Object.fromEntries(formData.entries());
  const authorizedActivities = JSON.parse(rawData.authorizedActivities as string);
  const documents = formData.getAll('documents').map(d => d.toString());
  
  const dataToValidate = { 
    ...rawData, 
    authorizedActivities, 
    capital: Number(rawData.capital),
    documents: documents.length > 0 ? documents : undefined
  };

  const validatedFields = economicLicenseSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos o hay errores. No se pudo agregar la licencia.',
      status: 'error',
    };
  }

  try {
    const licensesCollection = db.collection(`users/${userId}/economicLicenses`);
    await licensesCollection.add({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
      userId: userId,
    });
    revalidatePath('/licencias-economicas');
    return { message: 'Licencia económica agregada con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error adding license: ", error);
    return { message: 'Error al agregar la licencia.', status: 'error' };
  }
}

export async function deleteEconomicLicense(id: string) {
    const userId = await getUserId();
    try {
        const licenseRef = db.doc(`users/${userId}/economicLicenses/${id}`);
        await licenseRef.delete();
        revalidatePath('/licencias-economicas');
        return { message: 'Licencia eliminada con éxito.', status: 'success' };
    } catch (error) {
        console.error("Error deleting license: ", error);
        return { message: 'Error al eliminar la licencia.', status: 'error' };
    }
}

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

export async function updateSettings(prevState: any, formData: FormData) {
  const userId = await getUserId();
  const rawData = {
    companyName: formData.get('companyName'),
    logoUrl: formData.get('logoUrl'),
  };

  const validatedFields = settingsSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Datos inválidos.',
      status: 'error',
    };
  }

  try {
    const settingsRef = db.doc(`users/${userId}/settings/general`);
    
    await settingsRef.set({
        companyName: validatedFields.data.companyName || "",
        logoUrl: validatedFields.data.logoUrl || ""
    }, { merge: true });

    revalidatePath('/ajustes');
    revalidatePath('/(panel)', 'layout');

    return { message: 'Ajustes guardados con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error updating settings: ", error);
    return { message: 'Error al guardar los ajustes.', status: 'error' };
  }
}
