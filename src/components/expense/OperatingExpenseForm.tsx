'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { 
  operatingExpenseSchema, 
  operatingExpenseWithIdSchema, 
  type OperatingExpense, 
  type OperatingExpenseFormValues, 
  expenseCategories, 
  predefinedExpenseDescriptions 
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { processImage } from '@/lib/image-utils';
import { useAuth } from '@/firebase/provider';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function SubmitButton({ isPending, isEditMode }: { isPending: boolean, isEditMode: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar Gasto' : 'Guardar Gasto')}
    </Button>
  );
}

type OperatingExpenseFormProps = {
  isEditMode?: boolean;
  initialData?: OperatingExpense;
  onSuccess?: () => void;
};


export default function OperatingExpenseForm({ isEditMode = false, initialData, onSuccess }: OperatingExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialData?.documents || []);
  const user = useAuth();
  const [showCustomDescription, setShowCustomDescription] = useState(false);

  const form = useForm<OperatingExpenseFormValues>({
    resolver: zodResolver(isEditMode ? operatingExpenseWithIdSchema : operatingExpenseSchema),
    defaultValues: isEditMode && initialData ? {
      ...initialData,
      documents: initialData.documents || [],
    } : {
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: undefined,
      amountBolivares: 0,
      bcvRate: 0,
      amountEuros: 0,
      documents: [],
    },
  });
  
  const { control, setValue, handleSubmit, watch, register, trigger, reset, resetField } = form;

  const amountBolivares = watch('amountBolivares');
  const bcvRate = watch('bcvRate');
  const currentDescription = watch('description');

  useEffect(() => {
    if (isEditMode && initialData?.description) {
      const isPredefined = predefinedExpenseDescriptions.includes(initialData.description as any);
      setShowCustomDescription(!isPredefined);
    }
  }, [isEditMode, initialData]);


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
      setValue('documents', updatedPreviews);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error de imagen',
        description: 'No se pudo procesar uno o más archivos.',
      });
    }
  };
  
  const removePreview = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setValue('documents', updatedPreviews);
  };
  
  const handleDescriptionChange = (value: string) => {
    if (value === 'otra') {
      setShowCustomDescription(true);
      setValue('description', ''); 
    } else {
      setShowCustomDescription(false);
      setValue('description', value);
    }
    trigger('description');
  };

  const onSubmit = (values: OperatingExpenseFormValues) => {
    if (!user) {
        toast({variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.'});
        return;
    }
    const { firestore } = initializeFirebase();

    startTransition(() => {
        try {
            if (isEditMode && initialData?.id) {
                // RUTA CENTRALIZADA: default-user
                const expenseRef = doc(firestore, `users/default-user/operatingExpenses`, initialData.id);
                updateDocumentNonBlocking(expenseRef, { ...values });
                toast({title: 'Éxito', description: 'Gasto actualizado en base central.'});
            } else {
                // RUTA CENTRALIZADA: default-user
                const expensesCollection = collection(firestore, `users/default-user/operatingExpenses`);
                addDocumentNonBlocking(expensesCollection, {
                    ...values,
                    createdAt: serverTimestamp(),
                    authorId: user.uid, // Guardamos quién lo creó para auditoría
                });
                toast({title: 'Éxito', description: 'Gasto agregado a base central.'});
                
                // Reset manual del formulario
                reset({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  amountBolivares: 0,
                  bcvRate: 0,
                  amountEuros: 0,
                  documents: [],
                });
                resetField('category');
                setShowCustomDescription(false);
                setPreviews([]);
            }
            if(onSuccess) onSuccess();
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Error al procesar el gasto.'});
        }
    });
  };
  
  const isPredefined = predefinedExpenseDescriptions.includes(currentDescription as any);
  const selectValue = showCustomDescription ? 'otra' : (isPredefined ? currentDescription : '');

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={control} name="date" render={({ field }) => (
          <FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormItem>
            <FormLabel>Descripción</FormLabel>
            <Select onValueChange={handleDescriptionChange} value={selectValue}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una descripción" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {predefinedExpenseDescriptions.map(desc => (
                  <SelectItem key={desc} value={desc}>{desc}</SelectItem>
                ))}
                <SelectItem value="otra">Otra descripción...</SelectItem>
              </SelectContent>
            </Select>
        </FormItem>

        {showCustomDescription && (
            <FormField control={control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción Personalizada</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Compra de insumos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
            )} />
        )}

        <FormField control={control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel>Categoría</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {expenseCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={control} name="amountBolivares" render={({ field }) => (
            <FormItem>
              <FormLabel>Monto en Bolívares</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={control} name="bcvRate" render={({ field }) => (
            <FormItem>
              <FormLabel>Tasa BCV (Bs/€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div>
          <Label className="text-emerald-700 font-semibold">Monto en Euros (Calculado)</Label>
          <Input type="number" {...register('amountEuros')} readOnly className="mt-2 bg-emerald-50 border-emerald-200 font-bold" />
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="document-input">Comprobante(s) (Opcional)</Label>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 px-6 py-8 hover:bg-muted/50 transition-colors">
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
            <div className="flex text-sm text-muted-foreground">
              <Label htmlFor="document-input" className="relative cursor-pointer rounded-md font-semibold text-primary hover:underline">
                <span>Sube archivos</span>
                <Input id="document-input" type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
              </Label>
              <p className="pl-1">o arrastra y suelta</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 10MB</p>

            {previews.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4 w-full">
                {previews.map((src, index) => (
                  <div key={index} className="relative aspect-square border rounded-md overflow-hidden group">
                    <Image src={src} alt="Vista previa" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
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
