
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
  
  const settingsRef = useMemo(() => {
    return doc(firestore, `users/default-user/settings/general`);
  }, [firestore]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const logoUrl = settings?.logoUrl;
  const companyName = settings?.companyName || "Barbería Cesar's";

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
       {logoUrl && (
         <div className="relative w-24 h-24">
           <Image src={logoUrl} alt="Logo" fill sizes="96px" className="rounded-full object-cover" />
         </div>
       )}
      <h1 className="text-center text-4xl font-bold text-primary">
        {companyName}
      </h1>
    </div>
  );
}


export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <LoginBranding />
        <LoginForm />
      </div>
    </main>
  );
}
