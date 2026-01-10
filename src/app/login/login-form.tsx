'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';


const initialState = {
  message: '',
  errors: {},
  status: '',
};

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Iniciar Sesión
        </Button>
    );
}

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Error de inicio de sesión',
        description: state.message,
      });
    }
  }, [state, toast]);

  return (
    <Card>
      <form ref={formRef} action={formAction}>
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa a tu cuenta para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" name="email" type="email" placeholder="tu@correo.com" required />
            {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required />
            {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <SubmitButton isPending={isPending} />
            <p className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                    Regístrate
                </Link>
            </p>
        </CardFooter>
      </form>
    </Card>
  );
}