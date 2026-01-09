'use server';

import { revalidatePath } from 'next/cache';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { taxRecordSchema, type TaxRecord } from '@/types';
import { z } from 'zod';

export async function getTaxRecords(): Promise<TaxRecord[]> {
  try {
    const recordsCollection = collection(db, 'taxRecords');
    const q = query(recordsCollection, orderBy('paymentDate', 'desc'));
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

const formSchema = taxRecordSchema.extend({
  document: z.any(),
});

export async function addTaxRecord(prevState: any, formData: FormData) {
  const document = formData.get('document') as File;
  
  if (!document || document.size === 0) {
    return { message: 'El documento es requerido.', status: 'error' };
  }

  if (document.type !== 'image/jpeg') {
    return { message: 'El documento debe ser un archivo JPG.', status: 'error' };
  }

  const rawFormData = {
    paymentDate: formData.get('paymentDate'),
    description: formData.get('description'),
    amountBolivares: formData.get('amountBolivares'),
    bcvRate: formData.get('bcvRate'),
    amountEuros: formData.get('amountEuros'),
  };

  const validatedFields = taxRecordSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos. No se pudo agregar el registro.',
      status: 'error',
    };
  }
  
  const { amountBolivares, bcvRate } = validatedFields.data;
  const calculatedAmountEuros = parseFloat((amountBolivares / bcvRate).toFixed(2));

  try {
    // Upload image to Firebase Storage
    const storageRef = ref(storage, `tax_documents/${Date.now()}_${document.name}`);
    const snapshot = await uploadBytes(storageRef, document);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Add record to Firestore
    await addDoc(collection(db, 'taxRecords'), {
      ...validatedFields.data,
      amountEuros: calculatedAmountEuros,
      documentUrl: downloadURL,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/');
    return { message: 'Registro de impuesto agregado con éxito.', status: 'success' };
  } catch (error) {
    console.error("Error adding document: ", error);
    return { message: 'Error al agregar el registro.', status: 'error' };
  }
}
