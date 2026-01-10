'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { taxRecordSchema, type TaxRecord, economicLicenseSchema, type EconomicLicense, taxRecordWithIdSchema } from '@/types';

// Función auxiliar para limpiar datos de Firebase (Timestamps, etc)
const serializeData = (data: any) => JSON.parse(JSON.stringify(data));

export async function getTaxRecords(): Promise<TaxRecord[]> {
  try {
    const recordsCollection = collection(db, 'taxRecords');
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
    await addDoc(collection(db, 'taxRecords'), {
      ...rest,
      amountBolivares,
      bcvRate,
      amountEuros: calculatedAmountEuros,
      createdAt: serverTimestamp(),
    });
    success = true;
  } catch (error) {
    console.error("Error adding document: ", error);
    return { message: 'Error al agregar el registro.', status: 'error' };
  }

  // REVALIDAR FUERA DEL TRY/CATCH
  if (success) {
    revalidatePath('/');
    return { message: 'Registro de impuesto agregado con éxito.', status: 'success' };
  }
}

export async function updateTaxRecord(prevState: any, formData: FormData) {
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
    const recordRef = doc(db, 'taxRecords', id);
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
    revalidatePath('/');
    return { message: 'Registro de impuesto actualizado con éxito.', status: 'success' };
  }
}

export async function getEconomicLicenses(): Promise<EconomicLicense[]> {
  try {
    const licensesCollection = collection(db, 'economicLicenses');
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
    await addDoc(collection(db, 'economicLicenses'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
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