'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../ui/sheet';
import { Menu, Settings, Home, FileText, BarChart2, LogOut, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useAuth, useUserRole } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';

function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    const { auth } = initializeFirebase();
    try {
      router.push('/login');
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-200 hover:text-white hover:bg-red-900/20">
      <LogOut className="mr-2 h-4 w-4"/> Cerrar Sesión
    </Button>
  )
}

export default function Header() {
  const user = useAuth();
  const userRole = useUserRole();
  const { firestore } = initializeFirebase();

  // ESTABILIZACIÓN: useMemo evita que la referencia cambie en cada render
  const settingsRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', 'default-user', 'settings', 'general');
  }, [user, firestore]);

  const { data: settings } = useDoc(settingsRef);

  const logoUrl = settings?.logoUrl || '/logo-512.png';
  const companyName = settings?.companyName || 'Barberia Cesars';
  const isAdmin = userRole === 'super_admin';

  if (!user) return null;

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between h-20 px-4 md:px-8">
        <Link href="/impuestos" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="relative w-[50px] h-[50px] bg-white/10 rounded-full overflow-hidden border border-white/20">
            {settings?.logoUrl ? (
              <Image src={logoUrl} alt="Logo" fill sizes="50px" className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-slate-200 text-primary text-[10px] font-bold">LOGO</div>
            )}
          </div>
          <h1 className="text-xl font-bold font-headline tracking-tight">
            {companyName}
          </h1>
        </Link>
        
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild><Link href="/impuestos">Impuestos</Link></Button>
          <Button variant="ghost" asChild><Link href="/gastos-operacion">Gastos</Link></Button>
          <Button variant="ghost" asChild><Link href="/reportes">Reportes</Link></Button>
          <Button variant="ghost" asChild><Link href="/licencias-economicas">Licencias</Link></Button>
          {isAdmin && (
            <Button variant="ghost" className="bg-white/10" asChild>
              <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Link>
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link href="/ajustes"><Settings className="mr-2 h-4 w-4" />Ajustes</Link>
          </Button>
          <div className="ml-4 border-l border-white/20 pl-4">
            <LogoutButton />
          </div>
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
               <SheetTitle className="text-primary font-bold border-b pb-4">Navegación</SheetTitle>
               <SheetDescription className="sr-only">Menú principal</SheetDescription>
              <nav className="flex flex-col gap-2 mt-4">
                <Button variant="ghost" className="justify-start" asChild><Link href="/impuestos"><Home className="mr-2 h-4 w-4"/> Impuestos</Link></Button>
                <Button variant="ghost" className="justify-start" asChild><Link href="/gastos-operacion"><ShoppingCart className="mr-2 h-4 w-4"/> Gastos</Link></Button>
                <Button variant="ghost" className="justify-start" asChild><Link href="/reportes"><BarChart2 className="mr-2 h-4 w-4"/> Reportes</Link></Button>
                <Button variant="ghost" className="justify-start" asChild><Link href="/licencias-economicas"><FileText className="mr-2 h-4 w-4"/> Licencias</Link></Button>
                <div className="my-2 border-t" />
                <Button variant="ghost" className="justify-start" asChild><Link href="/ajustes"><Settings className="mr-2 h-4 w-4"/> Ajustes</Link></Button>
                <LogoutButton />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}