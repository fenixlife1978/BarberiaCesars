'use client';

import { useRef, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { 
  economicLicenseSchema, 
  economicLicenseWithIdSchema, 
  type EconomicLicense, 
  type EconomicLicenseFormValues 
} from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, PlusCircle, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Separator } from '../ui/separator';
import { processImage } from '@/lib/image-utils';
import { useAuth } from '@/firebase/provider';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function SubmitButton({ isPending, isEditMode }: { isPending: boolean, isEditMode: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar Licencia' : 'Guardar Licencia')}
    </Button>
  );
}

type EconomicLicenseFormProps = {
  isEditMode?: boolean;
  initialData?: EconomicLicense;
  onSuccess?: () => void;
};

export default function EconomicLicenseForm({ isEditMode = false, initialData, onSuccess }: EconomicLicenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [previews, setPreviews] = useState<string[]>(initialData?.documents || []);
  const user = useAuth();

  const form = useForm<EconomicLicenseFormValues>({
    resolver: zodResolver(isEditMode ? economicLicenseWithIdSchema : economicLicenseSchema),
    defaultValues: isEditMode && initialData ? {
      ...initialData,
      documents: initialData.documents || [],
    } : {
      taxpayerId: '',
      taxpayerName: '',
      capital: 0,
      fiscalAddress: '',
      cadastreNumber: '',
      legalRepresentative: '',
      legalRepresentativeId: '',
      propertyOwnerId: '',
      propertyOwnerName: '',
      propertyOwnerCiRif: '',
      propertyId: '',
      propertyCadastreNumber: '',
      licenseNumber: '',
      taxpayerLicenseId: '',
      issueDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      authorizedActivities: [{ code: '', description: '', aliquot: 0, taxableMinimum: 0 }],
      documents: [],
    },
  });
  
  const { control, setValue, handleSubmit, reset } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "authorizedActivities",
  });

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

  const onSubmit = (values: EconomicLicenseFormValues) => {
    if (!user) {
        toast({variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.'});
        return;
    }
    const { firestore } = initializeFirebase();

    startTransition(() => {
        try {
            if (isEditMode && initialData?.id) {
                // RUTA CENTRALIZADA
                const licenseRef = doc(firestore, `users/default-user/economicLicenses`, initialData.id);
                updateDocumentNonBlocking(licenseRef, values);
                toast({title: 'Éxito', description: 'Licencia actualizada en base central.'});
            } else {
                // RUTA CENTRALIZADA
                const licensesCollection = collection(firestore, `users/default-user/economicLicenses`);
                addDocumentNonBlocking(licensesCollection, {
                    ...values,
                    createdAt: serverTimestamp(),
                    authorId: user.uid,
                });
                toast({title: 'Éxito', description: 'Licencia agregada a base central.'});
                reset();
                setPreviews([]);
            }
            if(onSuccess) onSuccess();
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Error al procesar la licencia.'});
        }
    });
  };

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Sección: Contribuyente */}
        <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-primary border-b pb-2'>Información del Contribuyente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="taxpayerId" render={({ field }) => (
                    <FormItem><FormLabel>C.I. / RIF Contribuyente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="taxpayerName" render={({ field }) => (
                    <FormItem><FormLabel>Nombre o Razón Social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="capital" render={({ field }) => (
                    <FormItem><FormLabel>Capital Social</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="fiscalAddress" render={({ field }) => (
                    <FormItem><FormLabel>Dirección Fiscal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="cadastreNumber" render={({ field }) => (
                    <FormItem><FormLabel>Nro. de Catastro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="legalRepresentative" render={({ field }) => (
                    <FormItem><FormLabel>Representante Legal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="legalRepresentativeId" render={({ field }) => (
                    <FormItem><FormLabel>C.I. Representante Legal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>

        {/* Sección: Inmueble */}
        <div className='space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200'>
            <h3 className='text-lg font-semibold text-primary border-b border-slate-200 pb-2'>Información del Inmueble</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="propertyOwnerName" render={({ field }) => (
                    <FormItem><FormLabel>Propietario del Inmueble</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="propertyOwnerCiRif" render={({ field }) => (
                    <FormItem><FormLabel>C.I. / RIF Propietario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="propertyId" render={({ field }) => (
                    <FormItem><FormLabel>Código/ID Inmueble</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="propertyCadastreNumber" render={({ field }) => (
                    <FormItem><FormLabel>Nro. Catastro Inmueble</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>
        
        {/* Sección: Vigencia */}
        <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-primary border-b pb-2'>Identificación de la Licencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="licenseNumber" render={({ field }) => (
                    <FormItem><FormLabel>Número de Licencia</FormLabel><FormControl><Input {...field} className="font-bold text-accent" /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="taxpayerLicenseId" render={({ field }) => (
                    <FormItem><FormLabel>ID/Expediente Interno</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="issueDate" render={({ field }) => (
                    <FormItem><FormLabel>Fecha de Emisión</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="expirationDate" render={({ field }) => (
                    <FormItem><FormLabel>Fecha de Vencimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>

        {/* Sección: Rubros */}
        <div className='space-y-4'>
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className='text-lg font-semibold text-primary'>Rubros Autorizados</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ code: '', description: '', aliquot: 0, taxableMinimum: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar Rubro
            </Button>
          </div>
          {fields.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-md bg-white shadow-sm space-y-4 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pr-8">
                <FormField control={control} name={`authorizedActivities.${index}.code`} render={({ field }) => (
                    <FormItem><FormLabel>Código</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name={`authorizedActivities.${index}.description`} render={({ field }) => (
                    <FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name={`authorizedActivities.${index}.aliquot`} render={({ field }) => (
                    <FormItem><FormLabel>% Alícuota</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name={`authorizedActivities.${index}.taxableMinimum`} render={({ field }) => (
                    <FormItem><FormLabel>Mín. Imputable (Bs)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className='absolute top-2 right-2 text-destructive hover:bg-destructive/10' onClick={() => remove(index)}>
                    <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Sección: Documentos */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-primary">Comprobantes Digitales</Label>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-8 hover:bg-slate-50 transition-colors">
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
            <div className="flex text-sm">
              <Label htmlFor="document-input" className="relative cursor-pointer rounded-md font-semibold text-primary hover:underline">
                <span>Sube la licencia escaneada</span>
                <Input id="document-input" type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
              </Label>
              <p className="pl-1 text-muted-foreground">o arrastra aquí</p>
            </div>
            
            {previews.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {previews.map((src, index) => (
                  <div key={index} className="relative aspect-[3/4] border rounded-md overflow-hidden group">
                    <Image src={src} alt="Escaneo de licencia" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <FormField control={control} name="documents" render={({ field }) => (
              <FormItem className='hidden'><FormControl><Input type="hidden" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <SubmitButton isPending={isPending} isEditMode={isEditMode} />
      </form>
    </Form>
  );
}
