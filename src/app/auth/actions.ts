
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
    
    // Si no hay ajustes en la DB (`settings` es null) o no se ha definido una clave, usamos la lógica de PIN por defecto.
    if (!settings || !settings.accessKey) {
        if (pin === '123456') {
             const cookieStore = cookies();
            cookieStore.set('session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: SESSION_DURATION,
                path: '/',
            });
            redirect('/impuestos');
        } else {
            // Si no hay clave en la DB y el PIN no es el de por defecto.
            return { message: 'El PIN es incorrecto.', success: false };
        }
    }
    
    // Si hay ajustes y una clave definida, la comparamos.
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
    // Este catch es ahora un respaldo para errores inesperados de red o configuración,
    // pero el flujo principal de "permiso denegado" ya no debería ocurrir aquí.
    return { message: 'Ocurrió un error inesperado al verificar el PIN. Revisa tu conexión a internet.', success: false };
  }
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.delete('session');
  redirect('/login');
}
