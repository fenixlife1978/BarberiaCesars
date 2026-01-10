
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-4xl font-bold text-primary">
          Bienvenido a FiscalFlow
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
