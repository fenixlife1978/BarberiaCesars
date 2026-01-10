
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, limit } from 'firebase/firestore';
import { taxRecordSchema, type TaxRecord, economicLicenseSchema, type EconomicLicense, taxRecordWithIdSchema, settingsSchema, type Settings } from '@/types';

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
    revalidatePath('/impuestos');
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
    revalidatePath('/impuestos');
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

// Settings Actions
export async function getSettings(): Promise<Settings | null> {
  try {
    const settingsCollection = collection(db, 'settings');
    const q = query(settingsCollection, limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }
    const settingsDoc = querySnapshot.docs[0];
    return serializeData({ id: settingsDoc.id, ...settingsDoc.data() }) as Settings;
  } catch (error) {
    console.error("Error fetching settings: ", error);
    return null;
  }
}

export async function updateSettings(prevState: any, formData: FormData) {
  const rawData = {
    accessKey: formData.get('accessKey'),
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
    const currentSettings = await getSettings();
    const { accessKey, logoUrl } = validatedFields.data;

    const dataToUpdate: { accessKey?: string; logoUrl?: string } = {};

    // Solo incluimos los campos que tienen un valor.
    // Si la clave de acceso está vacía, no la actualizamos para que no se borre.
    if (accessKey && accessKey.length > 0) {
      dataToUpdate.accessKey = accessKey;
    }
    // Para el logo, sí permitimos que se borre si el string está vacío.
    if (logoUrl !== undefined) {
      dataToUpdate.logoUrl = logoUrl;
    }


    if (Object.keys(dataToUpdate).length === 0) {
      return { message: 'No hay cambios para guardar.', status: 'success' };
    }

    if (currentSettings) {
      // Update existing settings
      const settingsRef = doc(db, 'settings', currentSettings.id);
      await updateDoc(settingsRef, dataToUpdate);
    } else {
      // Create new settings document
      await addDoc(collection(db, 'settings'), dataToUpdate);
    }

    revalidatePath('/ajustes');
    revalidatePath('/login'); // To update logo on login page
    revalidatePath('/(panel)', 'layout'); // To update logo in header

    return { message: 'Ajustes guardados con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error updating settings: ", error);
    return { message: 'Error al guardar los ajustes.', status: 'error' };
  }
}
