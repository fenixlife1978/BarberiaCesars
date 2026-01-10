
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, limit, getDoc } from 'firebase/firestore';
import { taxRecordSchema, type TaxRecord, economicLicenseSchema, type EconomicLicense, taxRecordWithIdSchema, settingsSchema, type Settings } from '@/types';
import { getAuthenticatedUser } from './auth/get-authenticated-user';

// Función auxiliar para limpiar datos de Firebase (Timestamps, etc)
const serializeData = (data: any) => JSON.parse(JSON.stringify(data));

export async function getTaxRecords(userId: string): Promise<TaxRecord[]> {
  try {
    const recordsCollection = collection(db, 'users', userId, 'taxRecords');
    const q = query(recordsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return serializeData(records) as TaxRecord[]; // Limpieza de datos
  } catch (error) {
    console.error("Error fetching tax records: ", error);
    return [];
  }
}

export async function addTaxRecord(prevState: any, formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { message: 'Usuario no autenticado.', status: 'error' };
  }

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

  let success = false;
  try {
    const recordsCollection = collection(db, 'users', user.uid, 'taxRecords');
    await addDoc(recordsCollection, {
      ...rest,
      amountBolivares,
      bcvRate,
      amountEuros: calculatedAmountEuros,
      createdAt: serverTimestamp(),
      userId: user.uid,
    });
    success = true;
  } catch (error) {
    console.error("Error adding document: ", error);
    return { message: 'Error al agregar el registro.', status: 'error' };
  }

  if (success) {
    revalidatePath('/impuestos');
    return { message: 'Registro de impuesto agregado con éxito.', status: 'success' };
  }
}

export async function updateTaxRecord(prevState: any, formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { message: 'Usuario no autenticado.', status: 'error' };
  }

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
  
  let success = false;
  try {
    const recordRef = doc(db, 'users', user.uid, 'taxRecords', id);
    await updateDoc(recordRef, {
      ...rest,
      amountBolivares,
      bcvRate,
      amountEuros: calculatedAmountEuros,
    });
    success = true;
  } catch (error) {
    console.error("Error updating document: ", error);
    return { message: 'Error al actualizar el registro.', status: 'error' };
  }

  if (success) {
    revalidatePath('/impuestos');
    return { message: 'Registro de impuesto actualizado con éxito.', status: 'success' };
  }
}

export async function getEconomicLicenses(userId: string): Promise<EconomicLicense[]> {
  try {
    const licensesCollection = collection(db, 'users', userId, 'economicLicenses');
    const q = query(licensesCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
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
  const user = await getAuthenticatedUser();
  if (!user) {
    return { message: 'Usuario no autenticado.', status: 'error' };
  }
  
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

  let success = false;
  try {
    const licensesCollection = collection(db, 'users', user.uid, 'economicLicenses');
    await addDoc(licensesCollection, {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
      userId: user.uid,
    });
    success = true;
  } catch (error) {
    console.error("Error adding license: ", error);
    return { message: 'Error al agregar la licencia.', status: 'error' };
  }

  if (success) {
    revalidatePath('/licencias-economicas');
    return { message: 'Licencia económica agregada con éxito.', status: 'success' };
  }
}

// Settings Actions
export async function getSettings(userId: string): Promise<Settings | null> {
  try {
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'general');
    const settingsDoc = await getDoc(settingsDocRef);


    if (!settingsDoc.exists()) {
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
  const user = await getAuthenticatedUser();
  if (!user) {
    return { message: 'Usuario no autenticado.', status: 'error' };
  }

  const rawData = {
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
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'general');
    await updateDoc(settingsRef, validatedFields.data);

    revalidatePath('/ajustes');
    revalidatePath('/(panel)', 'layout'); // To update logo in header

    return { message: 'Ajustes guardados con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error updating settings: ", error);
    return { message: 'Error al guardar los ajustes.', status: 'error' };
  }
}
