'use client';

import { useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, type Settings, type SettingsFormValues } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { processImage } from '@/lib/image-utils';
import { useAuth } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar Configuración de Sistema
    </Button>
  );
}

export default function SettingsForm({ initialSettings }: { initialSettings?: Settings | null }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings?.logoUrl || null);
  const user = useAuth();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: initialSettings?.companyName || '',
      logoUrl: initialSettings?.logoUrl || '',
    },
  });

  if (!user) return null;

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processImage(file);
      setLogoPreview(processed);
      form.setValue('logoUrl', processed, { shouldValidate: true });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Imagen no válida.' });
    }
  };

  const onSubmit = (values: SettingsFormValues) => {
    const { firestore } = initializeFirebase();
    startTransition(() => {
      try {
        const settingsRef = doc(firestore, 'users', 'default-user', 'settings', 'general');
        setDocumentNonBlocking(settingsRef, {
          companyName: values.companyName || "",
          logoUrl: values.logoUrl || ""
        }, { merge: true });
        toast({ title: 'Éxito', description: 'Configuración global actualizada.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Sin permisos de escritura.' });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Institución</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Logo Institucional</Label>
          <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center bg-slate-50">
            {logoPreview ? (
              <div className="relative w-32 h-32">
                <Image src={logoPreview} alt="Preview" fill className="rounded-full object-cover border-2 border-white shadow-sm" />
                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setLogoPreview(null); form.setValue('logoUrl', ''); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                <Label htmlFor="logo-input" className="cursor-pointer text-primary font-medium hover:underline block mt-2">Subir logo</Label>
                <Input id="logo-input" type="file" className="sr-only" onChange={handleLogoChange} />
              </div>
            )}
          </div>
        </div>
        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}
