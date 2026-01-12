'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
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
import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Guardar Cambios
    </Button>
  );
}

type SettingsFormProps = {
  initialSettings?: Settings | null;
};

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings?.logoUrl || null);
  const user = useAuth();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: initialSettings?.companyName || '',
      logoUrl: initialSettings?.logoUrl || '',
    },
  });

  const { setValue, handleSubmit, control } = form;
  
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await processImage(file);
      setLogoPreview(processed);
      setValue('logoUrl', processed, { shouldValidate: true });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error de imagen',
        description: 'No se pudo procesar la imagen. Inténtalo de nuevo.',
      });
    }
  };

  const removeLogoPreview = () => {
    setLogoPreview(null);
    setValue('logoUrl', '', { shouldValidate: true });
  }

  const onSubmit = (values: SettingsFormValues) => {
    if (!user) {
        toast({variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.'});
        return;
    }
    const { firestore } = initializeFirebase();
    startTransition(() => {
        try {
            const settingsRef = doc(firestore, `users/${user.uid}/settings/general`);
            setDocumentNonBlocking(settingsRef, {
                companyName: values.companyName || "",
                logoUrl: values.logoUrl || ""
            }, { merge: true });
            toast({ title: 'Éxito', description: 'Ajustes guardados con éxito.'});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Error al guardar los ajustes.'});
        }
    });
  }

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <FormField
            control={control}
            name="companyName"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                        <Input placeholder="El nombre de tu empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />

        <div>
          <Label>Logo de la Empresa</Label>
          <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10">
            {logoPreview ? (
              <div className="relative group">
                 <div className="relative w-32 h-32">
                    <Image src={logoPreview} alt="Vista previa del logo" fill sizes="128px" className="rounded-full object-cover" />
                 </div>
                 <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={removeLogoPreview}
                    >
                      <X className="h-4 w-4" />
                    </Button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                  <Label htmlFor="logo-input" className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/80">
                    <span>Sube un archivo</span>
                    <Input id="logo-input" type="file" className="sr-only" accept="image/jpeg,image/png" onChange={handleLogoChange} />
                  </Label>
                  <p className="pl-1">o arrástralos aquí</p>
                </div>
                 <p className="text-xs leading-5 text-muted-foreground">PNG, JPG hasta 10MB</p>
              </div>
            )}
          </div>
        </div>
         <FormField
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem className='hidden'>
                <FormControl>
                  <Input type="hidden" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}
