'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';
import { Menu, Settings, Home, FileText, BarChart2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth, useUserRole } from '@/firebase/provider';
import { getAuth, signOut } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';


function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    const { auth } = initializeFirebase();
    await signOut(auth);
    router.push('/login');
  };

  return (
      <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
        <LogOut className="mr-2"/> Cerrar Sesión
      </Button>
  )
}

export default function Header() {
  const user = useAuth();
  const userRole = useUserRole();
  const { firestore } = initializeFirebase();

  const userIdToQuery = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);
  
  const settingsRef = useMemo(() => {
    if (!userIdToQuery) return null;
    return doc(firestore, `users/${userIdToQuery}/settings/general`);
  }, [userIdToQuery, firestore]);

  const { data: settings } = useDoc(settingsRef);

  const logoUrl = settings?.logoUrl || '/logo.png';
  const companyName = settings?.companyName || 'FiscalFlow';
  const isAdmin = userRole === 'super_admin';

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between h-20 px-4 md:px-8">
        <Link href="/impuestos" className="flex items-center gap-3">
          <div className="relative w-[50px] h-[50px]">
            {logoUrl && <Image src={logoUrl} alt="Logo" fill sizes="50px" className="rounded-full object-cover" />}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
            {companyName}
          </h1>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/impuestos">Pagos de Impuestos</Link>
          </Button>
           <Button variant="ghost" asChild>
            <Link href="/reportes">Reportes</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/licencias-economicas">Licencias Económicas</Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" asChild>
              <Link href="/admin"><ShieldCheck className="mr-2" />Admin</Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/ajustes">
              <Settings className="mr-2" />
              Ajustes
            </Link>
          </Button>
          <LogoutButton />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px]">
               <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
               <SheetDescription className="sr-only">Navegación principal de la aplicación</SheetDescription>
              <nav className="flex flex-col gap-4 mt-8">
                 <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/impuestos"><Home className="mr-2"/> Pagos de Impuestos</Link>
                </Button>
                 <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/reportes"><BarChart2 className="mr-2"/> Reportes</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/licencias-economicas"><FileText className="mr-2"/> Licencias</Link>
                </Button>
                 {isAdmin && (
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/admin"><ShieldCheck className="mr-2" />Admin</Link>
                  </Button>
                )}
                <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/ajustes"><Settings className="mr-2"/> Ajustes</Link>
                </Button>
                <LogoutButton />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
