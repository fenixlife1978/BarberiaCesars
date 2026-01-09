import { LogoIcon } from "@/components/icons";

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center h-16 px-4 md:px-8">
        <LogoIcon className="h-8 w-8 text-accent" />
        <h1 className="ml-3 text-2xl font-bold font-headline tracking-tight">
          FiscalFlow
        </h1>
      </div>
    </header>
  );
}
