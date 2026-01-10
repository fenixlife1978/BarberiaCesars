'use client';

import { useEffect, useRef, useState, useActionState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { economicLicenseSchema, type EconomicLicenseFormValues } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addEconomicLicense } from '@/app/actions';
import { UploadCloud, Loader2, PlusCircle, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Separator } from '../ui/separator';
import { processImage } from '@/lib/image-utils';

const initialState = {
  message: '',
  errors: {},
  status: '',
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isPending ? 'Guardando...' : 'Guardar Licencia'}
    </Button>
  );
}

export default function EconomicLicenseForm() {
  const [state, formAction, isPending] = useActionState(addEconomicLicense, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
      document: '',
    },
  });
  
  const { control, handleSubmit, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "authorizedActivities",
  });

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
    formData.set('authorizedActivities', JSON.stringify(currentValues.authorizedActivities));
    
    // We handle the file via state (base64), so we remove it from form data
    // to avoid sending a file object.
    formData.delete('document-input');
    formData.set('document', currentValues.document || '');

    formAction(formData);
  }

  return (
    <Form {...form}>
      <form ref={formRef} action={customFormAction} className="space-y-8">
        
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
          <Label htmlFor="document-input">Comprobante (opcional)</Label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
            <div className="text-center">
              {preview ? (
                <Image src={preview} alt="Vista previa" width={128} height={128} className="mx-auto h-32 w-32 object-contain" />
              ) : (
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              )}
              <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                <Label htmlFor="document-input" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
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
