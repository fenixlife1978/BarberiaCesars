import { z } from "zod";

export const taxRecordSchema = z.object({
  paymentDate: z.string().min(1, { message: "La fecha es requerida." }),
  description: z.string().min(3, { message: "La descripción debe tener al menos 3 caracteres." }),
  amountBolivares: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
  bcvRate: z.coerce.number().positive({ message: "La tasa BCV debe ser un número positivo." }),
  amountEuros: z.coerce.number(),
  document: z.string().optional(),
});

export type TaxRecordFormValues = z.infer<typeof taxRecordSchema>;

export type TaxRecord = {
  id: string;
  paymentDate: string;
  description: string;
  amountBolivares: number;
  bcvRate: number;
  amountEuros: number;
  document?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export const authorizedActivitySchema = z.object({
  code: z.string().min(1, 'El código es requerido.'),
  description: z.string().min(1, 'La descripción es requerida.'),
  aliquot: z.coerce.number().positive('La alícuota debe ser un número positivo.'),
  taxableMinimum: z.coerce.number().positive('El mínimo imputable debe ser un número positivo.'),
});

export const economicLicenseSchema = z.object({
  taxpayerId: z.string().min(1, 'C.I. / RIF del contribuyente es requerido.'),
  taxpayerName: z.string().min(1, 'El nombre del contribuyente es requerido.'),
  capital: z.coerce.number().positive('El capital debe ser un número positivo.'),
  fiscalAddress: z.string().min(1, 'La dirección fiscal es requerida.'),
  cadastreNumber: z.string().min(1, 'El número de catastro es requerido.'),
  legalRepresentative: z.string().min(1, 'El representante legal es requerido.'),
  legalRepresentativeId: z.string().min(1, 'C.I. del representante legal es requerida.'),
  
  propertyOwnerId: z.string().min(1, 'ID del propietario es requerido.'),
  propertyOwnerName: z.string().min(1, 'Nombre del propietario es requerido.'),
  propertyOwnerCiRif: z.string().min(1, 'C.I. / RIF del propietario es requerido.'),
  propertyId: z.string().min(1, 'ID del inmueble es requerido.'),
  propertyCadastreNumber: z.string().min(1, 'Nro. de Catastro del inmueble es requerido.'),
  
  licenseNumber: z.string().min(1, 'El número de licencia es requerido.'),
  issueDate: z.string().min(1, 'La fecha de emisión es requerida.'),
  expirationDate: z.string().min(1, 'La fecha de vencimiento es requerida.'),
  
  authorizedActivities: z.array(authorizedActivitySchema).min(1, 'Debe haber al menos un rubro autorizado.'),
  document: z.string().optional(),
});

export type EconomicLicenseFormValues = z.infer<typeof economicLicenseSchema>;
export type AuthorizedActivityFormValues = z.infer<typeof authorizedActivitySchema>;

export type EconomicLicense = EconomicLicenseFormValues & {
  id: string;
  document?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};
