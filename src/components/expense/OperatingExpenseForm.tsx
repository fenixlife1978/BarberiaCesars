
'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { operatingExpenseSchema, operatingExpenseWithIdSchema, type OperatingExpense, type OperatingExpenseFormValues, expenseCategories, predefinedExpenseDescriptions } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { processImage } from '@/lib/image-utils';
import { useAuth, useUserRole } from '@/firebase/provider';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
  const userRole = useUserRole();
  const [showCustomDescription, setShowCustomDescription] = useState(false);

  const userIdToUse = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

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
    // Determine if the description is custom when in edit mode
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
        description: 'No se pudo procesar uno o más archivos. Por favor, intenta de nuevo.',
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
    if (!userIdToUse) {
        toast({variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.'});
        return;
    }
    const { firestore } = initializeFirebase();

    startTransition(() => {
        try {
            if (isEditMode && initialData?.id) {
                const expenseRef = doc(firestore, `users/${userIdToUse}/operatingExpenses`, initialData.id);
                updateDocumentNonBlocking(expenseRef, { ...values });
                toast({title: 'Éxito', description: 'Gasto actualizado con éxito.'});
            } else {
                const expensesCollection = collection(firestore, `users/${userIdToUse}/operatingExpenses`);
                addDocumentNonBlocking(expensesCollection, {
                    ...values,
                    createdAt: serverTimestamp(),
                    userId: userIdToUse,
                });
                toast({title: 'Éxito', description: 'Gasto agregado con éxito.'});
                reset({
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  category: undefined,
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
            toast({variant: 'destructive', title: 'Error', description: 'Error al guardar el gasto.'});
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
            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
            <FormItem><FormLabel>Monto en Bolívares</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={control} name="bcvRate" render={({ field }) => (
            <FormItem><FormLabel>Tasa BCV de EUR del día</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div>
          <Label>Monto en Euros (calculado)</Label>
          <Input type="number" {...register('amountEuros')} readOnly className="mt-2 bg-muted/50" />
        </div>
        
        <div>
          <Label htmlFor="document-input">Comprobante(s) (opcional)</Label>
          <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-10">
            <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                <Label htmlFor="document-input" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
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
                  <Input type="hidden" {...field} />
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

    
