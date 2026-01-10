
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSessionCookie, verifyIdToken } from './firebase-admin';
import { revalidatePath } from 'next/cache';

const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

// Common function to set the session cookie
async function setSessionCookie(idToken: string) {
  const sessionCookie = await createSessionCookie(idToken, { expiresIn: SESSION_DURATION * 1000 });
  cookies().set('session', sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function login(prevState: any, formData: FormData) {
  const idToken = formData.get('idToken') as string;
  if (!idToken) {
    return { message: 'Token de autenticación no encontrado.', success: false };
  }

  try {
    await setSessionCookie(idToken);
    redirect('/impuestos');
  } catch (error) {
    console.error("Error al crear la cookie de sesión:", error);
    return { message: 'No se pudo iniciar sesión. Inténtalo de nuevo.', success: false };
  }
}

export async function signup(prevState: any, formData: FormData) {
  const idToken = formData.get('idToken') as string;
   if (!idToken) {
    return { message: 'Token de autenticación no encontrado.', success: false };
  }

  try {
    await setSessionCookie(idToken);
    redirect('/impuestos');
  } catch (error) {
     console.error("Error al crear la cookie de sesión en el registro:", error);
    return { message: 'No se pudo completar el registro. Inténtalo de nuevo.', success: false };
  }
}


export async function logout() {
  cookies().delete('session');
  revalidatePath('/', 'layout');
  redirect('/login');
}
