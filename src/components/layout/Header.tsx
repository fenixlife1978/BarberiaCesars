import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center justify-center h-16 px-4 md:px-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Barberia Cesar's
        </h1>
      </div>
    </header>
  );
}
