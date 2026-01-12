'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import LoginForm from './login-form';
import { Skeleton } from '@/components/ui/skeleton';

function LoginBranding() {
  const { firestore } = initializeFirebase();
  
  // Usamos una referencia fija a default-user para que el branding
  // siempre sea visible incluso antes de que alguien inicie sesión.
  const settingsRef = useMemo(() => {
    return doc(firestore, `users/default-user/settings/general`);
  }, [firestore]);

  const { data: settings, isLoading, error } = useDoc(settingsRef);

  // Si hay un error de carga, mostramos un nombre genérico
  const logoUrl = settings?.logoUrl;
  const companyName = settings?.companyName || "Alcaldía Municipal";

  if (isLoading) {
    return (
      <div className="mb-8 flex flex-col items-center justify-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-9 w-48" />
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col items-center justify-center gap-4">
       {logoUrl ? (
         <div className="relative w-24 h-24">
           <Image 
            src={logoUrl} 
            alt="Logo" 
            fill 
            sizes="96px" 
            className="rounded-full object-cover border-2 border-primary/10" 
            priority
          />
         </div>
       ) : (
         <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">LOGO</span>
         </div>
       )}
      <h1 className="text-center text-3xl md:text-4xl font-bold text-primary tracking-tight">
        {companyName}
      </h1>
      <p className="text-muted-foreground text-sm -mt-2">Sistema de gestión de Licencias, impuestos y gastos</p>
    </div>
  );
}


export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <LoginBranding />
        <LoginForm />
      </div>
      <p className="mt-8 text-xs text-slate-400">© 2026 Todos los derechos reservados</p>
    </main>
  );
}
