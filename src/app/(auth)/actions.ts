'use server';

import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';


const auth = getAuth(adminApp);
const db = getFirestore(adminApp);

const signupSchema = z.object({
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});


export async function signup(prevState: any, formData: FormData) {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Datos inválidos.',
      errors: validatedFields.error.flatten().fieldErrors,
      status: 'error',
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Create user profile in Firestore
    const userDoc: { email: string; id: string; role?: string } = {
      email: userRecord.email!,
      id: userRecord.uid,
    };
    
    // Assign admin role if email matches
    if (email === 'vallecondo@gmail.com') {
      userDoc.role = 'admin';
    }

    await db.collection('users').doc(userRecord.uid).set(userDoc);

  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return { message: 'El correo electrónico ya está en uso.', status: 'error' };
    }
    return { message: 'Error al crear el usuario. Por favor, inténtalo de nuevo.', status: 'error' };
  }

  // After successful signup, proceed to log in the user
  try {
    // This is NOT a real password check. In a real app, you'd get an ID token from the client.
    const idToken = await auth.createCustomToken(email);
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });

  } catch (error) {
     return { message: 'Error al iniciar sesión después del registro.', status: 'error' };
  }
  
  redirect('/impuestos');
}

export async function login(prevState: any, formData: FormData) {
   const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            message: 'Datos inválidos.',
            errors: validatedFields.error.flatten().fieldErrors,
            status: 'error'
        };
    }

    const { email, password } = validatedFields.data;
    
    try {
        // We can't verify password directly with firebase-admin.
        // The client will sign in and post the idToken.
        // For this example, we'll create a custom token if the user exists.
        const user = await auth.getUserByEmail(email);

        // This is NOT a real password check. In a real app, you'd get an ID token from the client.
        const idToken = await auth.createCustomToken(user.uid);
        
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        cookies().set('__session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: true });

    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            return { message: 'Correo o contraseña incorrectos.', status: 'error'};
        }
        return { message: 'Error al iniciar sesión.', status: 'error'};
    }

    redirect('/impuestos');
}


export async function logout() {
  const sessionCookie = cookies().get('__session')?.value;
  if (sessionCookie) {
    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie);
        await auth.revokeRefreshTokens(decodedClaims.sub);
    } catch (error) {
        // Ignore errors, we are logging out anyway
    }
  }
  cookies().set('__session', '', { maxAge: -1 });
  redirect('/login');
}
