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
    // Si el estado de autenticación ha terminado de cargar y el usuario es null,
    // significa que no está autenticado, así que lo redirigimos a login.
    if (user === null) {
      router.replace('/login');
    }
  }, [user, router]);
  
  // Mientras user es `undefined`, significa que Firebase está comprobando el estado de autenticación.
  // Mostramos un loader para mejorar la experiencia de usuario.
  if (user === undefined) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  // Si el usuario está autenticado (no es undefined ni null), mostramos el layout del panel.
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

  // Si user es null (y ya se ejecutó el useEffect), no se renderiza nada aquí
  // porque la redirección ya está en marcha.
  return null;
}
