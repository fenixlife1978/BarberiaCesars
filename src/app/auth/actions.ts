
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSettings } from '@/app/actions';
import { FirebaseError } from 'firebase/app';

const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

export async function login(prevState: any, formData: FormData) {
  const pin = formData.get('pin') as string;
  
  try {
    const settings = await getSettings();
    
    // Si no hay ajustes en la DB o si no se ha definido una clave, no se puede iniciar sesión.
    // La clave '123456' solo funciona si la colección 'settings' NO existe.
    // Una vez se guarda algo en ajustes, la clave debe gestionarse desde ahí.
    if (!settings?.accessKey) {
        // Caso especial: si la colección de ajustes NO existe, permitimos el PIN por defecto.
        // `getSettings` devuelve `null` si la colección está vacía.
        if (settings === null && pin === '123456') {
             const cookieStore = cookies();
            cookieStore.set('session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: SESSION_DURATION,
                path: '/',
            });
            redirect('/impuestos');
        }
      return { message: 'La clave de acceso no ha sido configurada en los Ajustes del sistema.', success: false };
    }
    
    if (pin === settings.accessKey) {
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
    if (error instanceof FirebaseError) {
         if (error.code === 'permission-denied') {
            return { message: 'Acceso denegado por las reglas de seguridad. Asegúrate de que las reglas de Firestore permitan leer la configuración.', success: false };
         }
    }
    return { message: 'Ocurrió un error al verificar el PIN. Revisa la conexión y las reglas de la base de datos.', success: false };
  }
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete('session');
  redirect('/login');
}
