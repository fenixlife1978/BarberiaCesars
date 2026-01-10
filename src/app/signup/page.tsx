
import SignupForm from './signup-form';

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-4xl font-bold text-primary">
          Crea tu cuenta en FiscalFlow
        </h1>
        <SignupForm />
      </div>
    </main>
  );
}
