'use client';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { initializeFirebase } from '@/firebase';
import { useAuth } from '@/firebase/provider';
import SettingsForm from "@/components/settings/SettingsForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const user = useAuth();
  const { firestore } = initializeFirebase();

  // ESTABILIZACIÓN: La referencia se envuelve en useMemo.
  // RUTA CENTRALIZADA: Apunta a 'users/default-user/settings/general'.
  const settingsRef = useMemo(() => {
    return doc(firestore, `users/default-user/settings/general`);
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  // PROTECCIÓN LOGOUT: Evita errores si el usuario no está autenticado.
  if (!user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
           <Skeleton className="h-64 w-full max-w-2xl" />
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
       <div className="w-full max-w-2xl flex justify-start">
        <BackButton />
      </div>
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Ajustes Generales</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-32 rounded-full mx-auto" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <SettingsForm initialSettings={settings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
