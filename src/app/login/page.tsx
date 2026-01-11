
import Image from 'next/image';
import LoginForm from './login-form';

export default function LoginPage() {
  const logoUrl = 'https://placehold.co/96x96/006241/F1E6D2?text=Logo';
  const companyName = "Barbería Cesar's";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
           <div className="relative w-24 h-24">
             <Image src={logoUrl} alt="Logo" fill sizes="96px" className="rounded-full object-cover" />
           </div>
          <h1 className="text-center text-4xl font-bold text-primary">
            {companyName}
          </h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
