
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu, Settings, LogOut, Home, FileText } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between h-20 px-4 md:px-8">
        <Link href="/impuestos" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Barberia Cesar's Logo" width={50} height={50} className="rounded-full" />
          <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight hidden sm:block">
            Barberia Cesar's
          </h1>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/impuestos">Pagos de Impuestos</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/licencias-economicas">Licencias Económicas</Link>
          </Button>
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
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px]">
              <nav className="flex flex-col gap-4 mt-8">
                 <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/impuestos"><Home className="mr-2"/> Pagos de Impuestos</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/licencias-economicas"><FileText className="mr-2"/> Licencias</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/ajustes"><Settings className="mr-2"/> Ajustes</Link>
                </Button>
                <div className="absolute bottom-4 right-4">
                  <LogoutButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

