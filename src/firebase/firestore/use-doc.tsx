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
    // 1. Si no hay referencia (ej. usuario cerrando sesión o ruta no definida), 
    // limpiamos el estado y detenemos cualquier ejecución.
    if (!docRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    // 2. Suscripción en tiempo real
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
        
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        // FILTRO DE SEGURIDAD: 
        // Si el error es 'permission-denied', lo silenciamos en la consola.
        // Esto ocurre normalmente cuando el estado de auth cambia a null 
        // pero el listener sigue activo un milisegundo más.
        if (err.code !== 'permission-denied') {
          console.error("Error en useDoc:", err);
        }
        
        setError(err);
        setIsLoading(false);
      }
    );

    // 3. Limpieza de la suscripción al desmontar el componente o cambiar la referencia
    return () => unsubscribe();
    
    // Usamos docRef?.path para asegurar que el efecto solo se reinicie 
    // si la ruta del documento cambia realmente, evitando bucles infinitos.
  }, [docRef?.path]); 

  return { data, isLoading, error };
}
