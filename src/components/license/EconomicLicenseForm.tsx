'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { economicLicenseSchema, type EconomicLicenseFormValues } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Loader2, PlusCircle, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Separator } from '../ui/separator';
import { processImage } from '@/lib/image-utils';
import { useAuth, useUserRole } from '@/firebase/provider';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? 'Guardando...' : 'Guardar Licencia'}
    </Button>
  );
}

export default function EconomicLicenseForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const user = useAuth();
  const userRole = useUserRole();

  const userIdToUse = useMemo(() => {
    if (!user) return null;
    return userRole === 'super_admin' ? 'default-user' : user.uid;
  }, [user, userRole]);

  const form = useForm<EconomicLicenseFormValues>({
    resolver: zodResolver(economicLicenseSchema),
    defaultValues: {
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
      issueDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      authorizedActivities: [{ code: '', description: '', aliquot: 0, taxableMinimum: 0 }],
      documents: [],
    },
  });
  
  const { control, setValue, handleSubmit } = form;

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
        description: 'No se pudo procesar uno o más archivos. Por favor, intenta de nuevo.',
      });
    }
  };
  
  const removePreview = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setValue('documents', updatedPreviews);
  };

  const onSubmit = (values: EconomicLicenseFormValues) => {
    if (!userIdToUse) {
        toast({variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.'});
        return;
    }
    const { firestore } = initializeFirebase();

    startTransition(async () => {
        try {
            const licensesCollection = collection(firestore, `users/${userIdToUse}/economicLicenses`);
            await addDoc(licensesCollection, {
                ...values,
                createdAt: serverTimestamp(),
                userId: userIdToUse,
            });
            toast({title: 'Éxito', description: 'Licencia económica agregada con éxito.'});
            form.reset();
            setPreviews([]);
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Error al agregar la licencia.'});
        }
    });
  };

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Contribuyente */}
        <div className='space-y-4'>
            <h3 className='text-lg font-medium text-primary'>Información del Contribuyente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="taxpayerId" render={({ field }) => (
                    <FormItem><FormLabel>C.I. / RIF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="taxpayerName" render={({ field }) => (
                    <FormItem><FormLabel>Contribuyente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="capital" render={({ field }) => (
                    <FormItem><FormLabel>Capital</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>
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
                    <FormItem><FormLabel>C.I. Rep. Legal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>

        <Separator />

        {/* Propietario del Inmueble */}
        <div className='space-y-4'>
            <h3 className='text-lg font-medium text-primary'>Información Propietario del Inmueble</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="propertyOwnerId" render={({ field }) => (
                    <FormItem><FormLabel>ID Propietario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="propertyOwnerName" render={({ field }) => (
                    <FormItem><FormLabel>Propietario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="propertyOwnerCiRif" render={({ field }) => (
                    <FormItem><FormLabel>C.I. / RIF</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="propertyId" render={({ field }) => (
                    <FormItem><FormLabel>ID Inmueble</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={control} name="propertyCadastreNumber" render={({ field }) => (
                    <FormItem><FormLabel>Nro. Catastro Inmueble</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>
        
        <Separator />

        {/* Identificación de la Licencia */}
        <div className='space-y-4'>
            <h3 className='text-lg font-medium text-primary'>Identificación y Vigencia de la Licencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={control} name="licenseNumber" render={({ field }) => (
                    <FormItem><FormLabel>Nro. Licencia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="issueDate" render={({ field }) => (
                    <FormItem><FormLabel>Fecha de Emisión</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={control} name="expirationDate" render={({ field }) => (
                    <FormItem><FormLabel>Fecha de Vencimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>

        <Separator />

        {/* Rubros Autorizados */}
        <div className='space-y-4'>
          <h3 className='text-lg font-medium text-primary'>Rubros Autorizados</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormItem><FormLabel>Mínimo Imputable Bs.</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="button" variant="destructive" size="icon" className='absolute top-2 right-2' onClick={() => remove(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ code: '', description: '', aliquot: 0, taxableMinimum: 0 })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Rubro
          </Button>
        </div>

        <Separator />

        {/* Documento */}
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

        <SubmitButton isPending={isPending} />
      </form>
    </Form>
  );
}
