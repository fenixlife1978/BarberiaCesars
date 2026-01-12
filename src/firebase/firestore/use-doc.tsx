'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData,
  FirestoreError 
} from 'firebase/firestore';

export function useDoc<T = any>(docRef: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    // 1. Si no hay referencia (ej. usuario cerrando sesión), limpiamos y salimos
    if (!docRef) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 2. Suscripción en tiempo real
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          // Solo actualizamos el estado con los datos + ID
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error en useDoc:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    // 3. Limpieza de la suscripción al desmontar o cambiar la referencia
    return () => unsubscribe();
    
    // IMPORTANTE: Usamos el path del documento como dependencia para evitar 
    // que referencias de objetos recreados disparen el bucle.
  }, [docRef?.path]); 

  return { data, isLoading, error };
}
