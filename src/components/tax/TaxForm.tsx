'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import {
  collection,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { taxRecordSchema, taxRecordWithIdSchema, type TaxRecord, type TaxRecordFormValues, months } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { processImage } from '@/lib/image-utils';
import { Checkbox } from '../ui/checkbox';
import { initializeFirebase } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { generateTaxDescription } from '@/ai/flows/generate-tax-description';
import { Textarea } from '../ui/textarea';
import { useAuth } from '@/firebase/provider';

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
  const [isGenerating, setIsGenerating] = useState(false);
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
  const descriptionValue = watch('description');

  useEffect(() => {
    if (amountBolivares > 0 && bcvRate > 0) {
      const amountEuros = amountBolivares / bcvRate;
      setValue('amountEuros', parseFloat(amountEuros.toFixed(2)));
    } else if (!isEditMode) {
      setValue('amountEuros', 0);
    }
  }, [amountBolivares, bcvRate, setValue, isEditMode]);

  const handleGenerateDescription = async () => {
    if (!descriptionValue) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un texto base para generar la descripción.' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateTaxDescription({ prompt: descriptionValue });
      if (result.description) {
        setValue('description', result.description, { shouldValidate: true });
        toast({ title: 'Éxito', description: 'Descripción generada y actualizada.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar la descripción.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    try {
      const newPreviews = await Promise.all(Array.from(files).map(processImage));
      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      setValue('documents', updatedPreviews, { shouldValidate: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error de imagen',
        description: 'No se pudo procesar la imagen.',
      });
    }
  };

  const removePreview = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setValue('documents', updatedPreviews, { shouldValidate: true });
  };
  
  const onSubmit = (values: TaxRecordFormValues) => {
    const { firestore } = initializeFirebase();
    // RUTA CENTRALIZADA
    const CENTRAL_PATH = `users/default-user/taxRecords`;

    const dataToSave = {
      ...values,
      category: 'Impuestos',
      updatedAt: serverTimestamp(),
    };

    startTransition(() => {
      try {
        if (isEditMode && initialData?.id) {
          const recordRef = doc(firestore, CENTRAL_PATH, initialData.id);
          updateDocumentNonBlocking(recordRef, dataToSave);
          toast({ title: 'Éxito', description: 'Registro actualizado en base central.' });
        } else {
          const recordsCollection = collection(firestore, CENTRAL_PATH);
          addDocumentNonBlocking(recordsCollection, {
            ...dataToSave,
            createdAt: serverTimestamp(),
          });
          toast({ title: 'Éxito', description: 'Registro guardado exitosamente.' });
          
          reset();
          setPreviews([]);
        }

        if (onSuccess) onSuccess();
      } catch (error: any) {
        console.error("Error en Firestore:", error);
        toast({
          variant: 'destructive',
          title: 'Error de Permisos',
          description: 'Asegúrate de que la regla en Firebase permita el acceso.',
        });
      }
    });
  };

  if (!user) return null;

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={control} name="paymentDate" render={({ field }) => (
            <FormItem><FormLabel>Fecha del pago</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="receiptNumber" render={({ field }) => (
            <FormItem><FormLabel>Nro. de Recibo</FormLabel><FormControl><Input placeholder="Ej: 001234" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción / Contribuyente</FormLabel>
                <div className="relative">
                    <Textarea placeholder="Ej: Pago IVA Febrero - Abasto El Sol..." {...field} className="pr-10" />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleGenerateDescription} 
                        disabled={isGenerating}
                        className="absolute top-1/2 right-1 -translate-y-1/2 text-accent hover:bg-accent/10"
                        title="Generar descripción con IA"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                </div>
              <FormMessage />
            </FormItem>
        )} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={control} name="amountBolivares" render={({ field }) => (
            <FormItem><FormLabel>Monto en Bolívares</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="bcvRate" render={({ field }) => (
            <FormItem><FormLabel>Tasa BCV (EUR)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div>
          <Label>Monto en Euros (Calculado automáticamente)</Label>
          <Input type="number" {...register('amountEuros')} readOnly className="mt-2 bg-muted/50 font-bold text-primary" />
        </div>

        <FormField control={control} name="settledMonths" render={({ field }) => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base font-bold text-primary">Meses a Cancelar</FormLabel>
              <div className="flex items-center justify-center gap-4 mt-2">
                <Button type="button" variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-lg font-extrabold tabular-nums bg-primary text-primary-foreground px-4 py-1 rounded-md">{selectedYear}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {months.map((month) => {
                const monthYear = `${month}-${selectedYear}`;
                return (
                  <FormItem key={monthYear} className="flex flex-row items-center space-x-2 space-y-0 border p-2 rounded-md hover:bg-accent/10 transition-colors">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(monthYear)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), monthYear]
                            : field.value?.filter((value) => value !== monthYear);
                          field.onChange(newValue);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-[10px] font-bold cursor-pointer uppercase">{month}</FormLabel>
                  </FormItem>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-2">
          <Label>Adjuntar Comprobantes</Label>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 bg-muted/20">
            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="flex text-sm">
              <Label htmlFor="document-input" className="relative cursor-pointer font-bold text-primary hover:underline">
                <span>Subir captures</span>
                <Input id="document-input" type="file" className="sr-only" accept="image/jpeg,image/png" multiple onChange={handleFileChange} />
              </Label>
            </div>
            
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2 w-full">
                {previews.map((src, index) => (
                  <div key={index} className="relative aspect-square border rounded overflow-hidden">
                    <Image src={src} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => removePreview(index)} className="absolute top-0 right-0 bg-destructive text-white p-1">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SubmitButton isPending={isPending} isEditMode={isEditMode} />
      </form>
    </Form>
  );
}
