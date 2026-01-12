'use client';
// IMPORTANTE: Asegúrate de que '.' apunte al archivo que inicializa el CLIENTE (firebase/index.ts)
import { initializeFirebase } from '.'; 
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext<User | null | undefined>(undefined);
const UserRoleContext = createContext<string | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();

    const unsubscribeAuth = onIdTokenChanged(auth, async (currentUser) => {
      // 1. Establecemos el usuario inmediatamente
      setUser(currentUser);

      if (currentUser) {
        try {
          // 2. Obtenemos el rol de los Custom Claims
          const idTokenResult = await currentUser.getIdTokenResult(true);
          const roleFromClaim = idTokenResult.claims.role as string || null;
          setUserRole(roleFromClaim);

          // 3. Escuchamos el documento del usuario (Tu UID: OLgPD8W3QsOLqqFc447jTVhsFrm1)
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
               // Aquí podrías guardar datos adicionales si los necesitas
               console.log("Datos de usuario cargados:", docSnap.data());
            }
          }, (error) => {
            console.error("Error en el snapshot de Firestore:", error);
          });

          return () => unsubscribeDoc();
        } catch (error) {
          console.error("Error obteniendo token:", error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Mientras el estado es undefined, la app está cargando el estado inicial
  return (
    <AuthContext.Provider value={user}>
      <UserRoleContext.Provider value={userRole}>
        {children}
      </UserRoleContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useUserRole = () => useContext(UserRoleContext);