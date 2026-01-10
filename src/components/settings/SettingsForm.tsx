
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSettings } from '@/app/actions';
import { settingsSchema, type Settings, type SettingsFormValues } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, X, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { processImage } from '@/lib/image-utils';

const initialState = {
  message: '',
  errors: {},
  status: '',
};

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
  const [state, formAction, isPending] = useActionState(updateSettings, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSettings?.logoUrl || null);
  const [showKey, setShowKey] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      accessKey: '', // Siempre empezar vacío por seguridad
      logoUrl: initialSettings?.logoUrl || '',
    },
  });

  const { setValue, watch } = form;
  const currentLogoUrl = watch('logoUrl');

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Éxito',
        description: state.message,
      });
       if(currentLogoUrl){
        setLogoPreview(currentLogoUrl);
      }
      form.reset({
        accessKey: '', // Limpiar el campo de clave de acceso después de guardar
        logoUrl: currentLogoUrl,
      });
    } else if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message || 'No se pudieron guardar los ajustes.',
      });
    }
  }, [state, toast, form, currentLogoUrl]);
  
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

  const customAction = (formData: FormData) => {
    const values = form.getValues();
    formData.set('logoUrl', values.logoUrl || ''); // Asegurarse que es un string
    formAction(formData);
  }

  return (
    <Form {...form}>
      <form ref={formRef} action={customAction} className="space-y-8">
        <FormField
          control={form.control}
          name="accessKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Clave de Acceso (6 dígitos)</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showKey ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="Dejar en blanco para no cambiar"
                    {...field}
                    className="pr-10"
                  />
                </FormControl>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowKey(!showKey)}
                    aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                >
                    {showKey ? <EyeOff /> : <Eye />}
                </Button>
              </div>
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
                  <p className="pl-1">o arrástralo aquí</p>
                </div>
                 <p className="text-xs leading-5 text-muted-foreground">PNG, JPG hasta 10MB</p>
              </div>
            )}
          </div>
        </div>

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}
