'use server';

import { revalidatePath } from 'next/cache';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { taxRecordSchema, type TaxRecord, economicLicenseSchema, type EconomicLicense } from '@/types';

async function uploadDocument(base64: string, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadString(storageRef, base64, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

export async function getTaxRecords(): Promise<TaxRecord[]> {
  try {
    const recordsCollection = collection(db, 'taxRecords');
    const q = query(recordsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TaxRecord[];
    return records;
  } catch (error) {
    console.error("Error fetching tax records: ", error);
    return [];
  }
}

export async function addTaxRecord(prevState: any, formData: FormData) {
  const rawFormData = {
    paymentDate: formData.get('paymentDate'),
    description: formData.get('description'),
    amountBolivares: formData.get('amountBolivares'),
    bcvRate: formData.get('bcvRate'),
    amountEuros: formData.get('amountEuros'),
    document: formData.get('document') || undefined, // Treat empty string as undefined for optional field
  };

  const validatedFields = taxRecordSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos. No se pudo agregar el registro.',
      status: 'error',
    };
  }
  
  const { amountBolivares, bcvRate, document, ...rest } = validatedFields.data;
  const calculatedAmountEuros = parseFloat((amountBolivares / bcvRate).toFixed(2));

  try {
    let documentUrl = '';
    if (document) {
       documentUrl = await uploadDocument(document, `taxRecords/${Date.now()}.jpg`);
    }

    await addDoc(collection(db, 'taxRecords'), {
      ...rest,
      amountBolivares,
      bcvRate,
      amountEuros: calculatedAmountEuros,
      documentUrl: documentUrl,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/');
    return { message: 'Registro de impuesto agregado con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { message: 'Error al agregar el registro.', status: 'error' };
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
    })) as EconomicLicense[];
    return licenses;
  } catch (error) {
    console.error("Error fetching economic licenses: ", error);
    return [];
  }
}

export async function addEconomicLicense(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  
  const authorizedActivities = JSON.parse(rawData.authorizedActivities as string);

  const dataToValidate = { ...rawData, authorizedActivities, capital: Number(rawData.capital) };

  const validatedFields = economicLicenseSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos o hay errores. No se pudo agregar la licencia.',
      status: 'error',
    };
  }

  try {
    const { document, ...dataToSave } = validatedFields.data;
    let documentUrl = '';
    if (document) {
       documentUrl = await uploadDocument(document, `economicLicenses/${Date.now()}.jpg`);
    }

    await addDoc(collection(db, 'economicLicenses'), {
      ...dataToSave,
      documentUrl: documentUrl,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/licencias-economicas');
    return { message: 'Licencia económica agregada con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error adding license: ", error);
    return { message: 'Error al agregar la licencia.', status: 'error' };
  }
}
