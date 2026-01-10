
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const user = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/impuestos');
    } else if (user === null) {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
