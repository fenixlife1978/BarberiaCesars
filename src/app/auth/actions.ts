
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSettings } from '@/app/actions';

const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

export async function login(prevState: any, formData: FormData) {
  const pin = formData.get('pin') as string;
  
  try {
    const settings = await getSettings();
    // Si no hay ajustes, se usa '123456'. Si hay ajustes pero no clave, se usa '123456'.
    const accessKey = settings?.accessKey || '123456'; 
    
    if (pin === accessKey) {
      const cookieStore = cookies();
      cookieStore.set('session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DURATION,
        path: '/',
      });
      redirect('/impuestos');
    } else {
      return { message: 'El PIN es incorrecto.', success: false };
    }
  } catch (error) {
    console.error("Login error:", error);
    // Este error solo debería ocurrir si hay un problema con Firestore, no si los ajustes no existen.
    return { message: 'Ocurrió un error al verificar el PIN. Revisa la conexión a la base de datos.', success: false };
  }
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete('session');
  redirect('/login');
}
