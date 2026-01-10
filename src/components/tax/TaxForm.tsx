'use client';

import { useEffect, useRef, useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { taxRecordSchema, type TaxRecordFormValues, months } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addTaxRecord } from '@/app/actions';
import { UploadCloud, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { processImage } from '@/lib/image-utils';
import { Checkbox } from '../ui/checkbox';

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

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const form = useForm<TaxRecordFormValues>({
    resolver: zodResolver(taxRecordSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      description: '',
      receiptNumber: '',
      amountBolivares: 0,
      bcvRate: 0,
      amountEuros: 0,
      settledMonths: [],
      document: '',
    },
  });

  const { watch, setValue, control, register } = form;
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
      setSelectedYear(currentYear);
    } else if (state.status === 'error' && state.message) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast, form, currentYear]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
      setValue('document', '');
    }
    if (file) {
      try {
        const compressedImage = await processImage(file);
        setPreview(compressedImage);
        setValue('document', compressedImage);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error de imagen',
          description: 'No se pudo procesar el archivo. Por favor, intenta con otra imagen.',
        });
      }
    }
  };
  
  const customFormAction = (formData: FormData) => {
    const currentValues = form.getValues();
    
    // Clear old formData values for settledMonths
    formData.delete('settledMonths');

    // Append all selected months from the form's state
    currentValues.settledMonths.forEach(monthYear => {
        formData.append('settledMonths', monthYear);
    });

    formData.set('amountBolivares', String(currentValues.amountBolivares));
    formData.set('bcvRate', String(currentValues.bcvRate));
    formData.set('amountEuros', String(currentValues.amountEuros));
    
    formData.delete('document-input');
    formData.set('document', currentValues.document || '');

    formAction(formData);
  }

  return (
    <Form {...form}>
      <form ref={formRef} action={customFormAction} className="space-y-6">
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
            name="receiptNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nro. de Recibo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 001234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
                <FormLabel>Tasa BCV de EUR del día</FormLabel>
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
          <Input type="number" {...register('amountEuros')} readOnly className="mt-2 bg-muted/50" />
        </div>

        <FormField
          control={control}
          name="settledMonths"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Meses Cancelados</FormLabel>
                 <div className="flex items-center justify-center gap-4 mt-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold tabular-nums">{selectedYear}</span>
                    <Button type="button" variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {months.map((month) => {
                  const monthYear = `${month}-${selectedYear}`;
                  return (
                    <FormItem
                      key={monthYear}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(monthYear)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...(field.value || []), monthYear]
                              : field.value?.filter(
                                  (value) => value !== monthYear
                                );
                            field.onChange(newValue);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {month}
                      </FormLabel>
                    </FormItem>
                  )
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

       
        <div>
          <Label htmlFor="document-input">Comprobante (JPG)</Label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
            <div className="text-center">
              {preview ? (
                <Image src={preview} alt="Vista previa" width={128} height={128} className="mx-auto h-32 w-32 object-contain" />
              ) : (
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              )}
              <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                <Label
                  htmlFor="document-input"
                  className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                >
                  <span>Sube un archivo</span>
                  <Input id="document-input" name="document-input" type="file" className="sr-only" accept="image/jpeg,image/png" onChange={handleFileChange} />
                </Label>
                <p className="pl-1">o arrástralo aquí</p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">Imágenes de hasta 10MB</p>
            </div>
          </div>
          <FormField
            control={control}
            name="document"
            render={({ field }) => (
              <FormItem className='hidden'>
                <FormControl>
                  <Input type="hidden" {...field} />
                </FormControl>
                 <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}
