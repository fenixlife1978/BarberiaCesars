
'use client';

import { useActionState } from 'react';
import { useFormState } from 'react-dom';
import { login } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getSettings } from '@/app/actions';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Ingresar
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.success) {
      toast({
        title: 'Error de Acceso',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 flex items-center gap-4">
          <Image src="/logo.png" alt="Barberia Cesar's Logo" width={80} height={80} className="rounded-full" />
          <h1 className="text-4xl font-bold text-primary">Barberia Cesar's</h1>
      </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acceso al Panel</CardTitle>
          <CardDescription>Ingresa tu clave de 6 dígitos para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin" className="sr-only">
                PIN de 6 dígitos
              </Label>
              <Input
                id="pin"
                name="pin"
                type="password"
                required
                maxLength={6}
                placeholder="------"
                className="text-center text-2xl tracking-[1rem]"
                autoComplete="current-password"
              />
            </div>
            <SubmitButton isPending={isPending} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
