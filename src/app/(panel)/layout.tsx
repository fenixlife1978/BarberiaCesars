'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from "@/components/layout/Header";
import { useAuth } from "@/firebase/provider";
import { Loader2 } from 'lucide-react';

export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);
  
  if (user === undefined) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  if (user) {
      return (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      );
  }

  return null;
}
