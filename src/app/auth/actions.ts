
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSettings } from '@/app/actions';
import { FirebaseError } from 'firebase/app';

const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

export async function login(prevState: any, formData: FormData) {
  const accessKey = formData.get('accessKey') as string;
  
  try {
    const settings = await getSettings();
    
    // Lógica principal de verificación:
    // 1. Si hay 'settings' en la DB y una 'accessKey' definida:
    if (settings && settings.accessKey) {
      if (accessKey === settings.accessKey) {
        // La clave coincide, creamos la sesión
        const cookieStore = cookies();
        cookieStore.set('session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_DURATION,
            path: '/',
        });
        redirect('/impuestos');
      } else {
        // La clave no coincide
        return { message: 'La clave de acceso es incorrecta.', success: false };
      }
    } else {
      // 2. Si no hay 'settings' o no hay 'accessKey' definida, usamos la clave por defecto
      if (accessKey === '123456') {
        const cookieStore = cookies();
        cookieStore.set('session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: SESSION_DURATION,
            path: '/',
        });
        redirect('/impuestos');
      } else {
        // La clave por defecto no coincide
        return { message: 'La clave de acceso es incorrecta.', success: false };
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    // Este catch es para errores inesperados, como problemas de red al contactar Firestore.
    return { message: 'Ocurrió un error inesperado al verificar la clave. Revisa tu conexión a internet y las reglas de seguridad de Firestore.', success: false };
  }
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete('session');
  redirect('/login');
}
