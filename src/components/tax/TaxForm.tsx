'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { taxRecordSchema, taxRecordWithIdSchema, type TaxRecord, type TaxRecordFormValues, months } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { processImage } from '@/lib/image-utils';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function SubmitButton({ isPending, isEditMode }: { isPending: boolean, isEditMode: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar Pago' : 'Guardar Pago')}
    </Button>
  );
}

type TaxFormProps = {
  isEditMode?: boolean;
  initialData?: TaxRecord;
  onSuccess?: () => void;
};

export default function TaxForm({ isEditMode = false, initialData, onSuccess }: TaxFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialData?.documents || []);
  const user = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(
    initialData?.settledMonths?.[0] ? parseInt(initialData.settledMonths[0].split('-')[1]) : currentYear
  );

  const form = useForm<TaxRecordFormValues>({
    resolver: zodResolver(isEditMode ? taxRecordWithIdSchema : taxRecordSchema),
    defaultValues: isEditMode && initialData ? {
      ...initialData,
      documents: initialData.documents || [],
      category: 'Impuestos',
    } : {
      paymentDate: new Date().toISOString().split('T')[0],
      description: '',
      receiptNumber: '',
      amountBolivares: 0,
      bcvRate: 0,
      amountEuros: 0,
      settledMonths: [],
      documents: [],
      category: 'Impuestos',
    },
  });

  const { watch, setValue, control, register, handleSubmit, reset } = form;
  const amountBolivares = watch('amountBolivares');
  const bcvRate = watch('bcvRate');

  useEffect(() => {
    if (amountBolivares > 0 && bcvRate > 0) {
      const amountEuros = amountBolivares / bcvRate;
      setValue('amountEuros', parseFloat(amountEuros.toFixed(2)));
    } else if (!isEditMode) {
      setValue('amountEuros', 0);
    }
  }, [amountBolivares, bcvRate, setValue, isEditMode]);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const newPreviews = await Promise.all(Array.from(files).map(processImage));
      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      setValue('documents', updatedPreviews, { shouldValidate: true });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error de imagen',
        description: 'No se pudo procesar uno o más archivos. Por favor, intenta de nuevo.',
      });
    }
  };

  const removePreview = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setValue('documents', updatedPreviews, { shouldValidate: true });
  };
  
  const onSubmit = (values: TaxRecordFormValues) => {
    if (!user) {
        toast({variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.'});
        return;
    }
    const { firestore } = initializeFirebase();

    const dataToSave = {
      ...values,
      category: 'Impuestos', // Always ensure category is set
    };

    startTransition(() => {
        try {
            if (isEditMode && initialData?.id) {
                 const recordRef = doc(firestore, `users/${user.uid}/taxRecords`, initialData.id);
                 updateDocumentNonBlocking(recordRef, dataToSave);
                 toast({title: 'Éxito', description: 'Registro actualizado con éxito.'});
            } else {
                const recordsCollection = collection(firestore, `users/${user.uid}/taxRecords`);
                addDocumentNonBlocking(recordsCollection, {
                    ...dataToSave,
                    createdAt: serverTimestamp(),
                    userId: user.uid,
                });
                toast({title: 'Éxito', description: 'Registro agregado con éxito.'});
                reset({
                  paymentDate: new Date().toISOString().split('T')[0],
                  description: '',
                  receiptNumber: '',
                  amountBolivares: 0,
                  bcvRate: 0,
                  amountEuros: 0,
                  settledMonths: [],
                  documents: [],
                  category: 'Impuestos',
                });
                setPreviews([]);
                setSelectedYear(currentYear);
            }
            if (onSuccess) onSuccess();
        } catch (error) {
             toast({variant: 'destructive', title: 'Error', description: 'Ocurrió un error al guardar el registro.'});
        }
    });
  };


  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <Label htmlFor="document-input">Comprobante(s)</Label>
          <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10">
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                <Label
                  htmlFor="document-input"
                  className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                >
                  <span>Sube uno o más archivos</span>
                  <Input id="document-input" name="document-input" type="file" className="sr-only" accept="image/jpeg,image/png" multiple onChange={handleFileChange} />
                </Label>
                <p className="pl-1">o arrástralos aquí</p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">Imágenes de hasta 10MB</p>
            </div>
             {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previews.map((src, index) => (
                  <div key={index} className="relative group">
                    <Image src={src} alt={`Vista previa ${index + 1}`} width={100} height={100} className="w-full h-auto object-contain rounded-md" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removePreview(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <FormField
            control={control}
            name="documents"
            render={({ field }) => (
              <FormItem className='hidden'>
                <FormControl>
                  <Input type="hidden" {...field} value={field.value?.join(',') || ''} />
                </FormControl>
                 <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SubmitButton isPending={isPending} isEditMode={isEditMode} />
      </form>
    </Form>
  );
}
