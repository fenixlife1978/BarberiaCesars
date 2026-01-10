'use client';

import { useEffect, useRef, useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { taxRecordSchema, type TaxRecordFormValues } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addTaxRecord } from '@/app/actions';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const initialState = {
  message: '',
  errors: {},
  status: '',
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? 'Guardando...' : 'Guardar Pago'}
    </Button>
  );
}

export default function TaxForm() {
  const [state, formAction, isPending] = useActionState(addTaxRecord, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<TaxRecordFormValues>({
    resolver: zodResolver(taxRecordSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      description: '',
      amountBolivares: 0,
      bcvRate: 0,
      amountEuros: 0,
    },
  });

  const { watch, setValue, control } = form;
  const amountBolivares = watch('amountBolivares');
  const bcvRate = watch('bcvRate');

  useEffect(() => {
    if (amountBolivares > 0 && bcvRate > 0) {
      const amountEuros = amountBolivares / bcvRate;
      setValue('amountEuros', parseFloat(amountEuros.toFixed(2)));
    } else {
      setValue('amountEuros', 0);
    }
  }, [amountBolivares, bcvRate, setValue]);

  useEffect(() => {
    if (state.status === 'success') {
      toast({
        title: 'Éxito',
        description: state.message,
      });
      form.reset();
      setPreview(null);
      formRef.current?.reset();
    } else if (state.status === 'error' && state.message) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (file && file.type === 'image/jpeg') {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else {
      setPreview(null);
      if(file) {
        toast({
          variant: 'destructive',
          title: 'Archivo no válido',
          description: 'Por favor, sube un archivo JPG.',
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form ref={formRef} action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha del pago</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: IVA Febrero" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="amountBolivares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto en Bolívares</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="bcvRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasa BCV del día</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <Label>Monto en Euros (calculado)</Label>
          <Input type="number" {...form.register('amountEuros')} readOnly className="mt-2 bg-muted/50" />
        </div>
        <div>
          <Label htmlFor="document">Comprobante (JPG)</Label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
            <div className="text-center">
              {preview ? (
                <Image src={preview} alt="Vista previa" width={128} height={128} className="mx-auto h-32 w-32 object-contain" />
              ) : (
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              )}
              <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                <Label
                  htmlFor="document"
                  className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                >
                  <span>Sube un archivo</span>
                  <Input id="document" name="document" type="file" className="sr-only" accept="image/jpeg" onChange={handleFileChange} />
                </Label>
                <p className="pl-1">o arrástralo aquí</p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">Solo archivos JPG de hasta 10MB</p>
            </div>
          </div>
        </div>
        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}
