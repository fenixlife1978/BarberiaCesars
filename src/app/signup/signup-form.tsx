'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { initializeFirebase } from '@/firebase';

function SubmitButton({ isPending }: { isPending: boolean }) {
    return (
        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear Cuenta'}
        </Button>
    );
}

export default function SignupForm() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsPending(true);
        setError(null);

        if (password.length < 6) {
            const msg = 'La contraseña debe tener al menos 6 caracteres.';
            setError(msg);
            toast({ variant: 'destructive', title: 'Error de registro', description: msg });
            setIsPending(false);
            return;
        }

        try {
            const { auth, firestore } = initializeFirebase();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocData: { email: string; id: string; role?: string, createdAt: any } = {
              email: user.email!,
              id: user.uid,
              createdAt: serverTimestamp(),
            };

            if (email === 'vallecondo@gmail.com') {
                userDocData.role = 'super_admin';
            }
            
            // Create user document in Firestore from the client
            await setDoc(doc(firestore, "users", user.uid), userDocData);

            // Redirect after successful signup, PanelLayout will handle the auth state change
            router.push('/impuestos');

        } catch (e) {
            const error = e as AuthError;
            let errorMessage = 'Error al registrar el usuario. Por favor, inténtalo de nuevo.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'El correo electrónico ya está en uso.';
            }
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Error de registro',
                description: errorMessage,
            });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Crear Cuenta</CardTitle>
                    <CardDescription>Completa el formulario para registrarte.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" name="email" type="email" placeholder="tu@correo.com" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <SubmitButton isPending={isPending} />
                    <p className="text-center text-sm text-muted-foreground">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Inicia Sesión
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
