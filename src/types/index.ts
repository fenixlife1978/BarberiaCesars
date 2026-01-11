
import { z } from "zod";

export const months = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const taxRecordSchema = z.object({
  paymentDate: z.string().min(1, { message: "La fecha es requerida." }),
  description: z.string().min(3, { message: "La descripción debe tener al menos 3 caracteres." }),
  receiptNumber: z.string().min(1, { message: "El número de recibo es requerido." }),
  amountBolivares: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
  bcvRate: z.coerce.number().positive({ message: "La tasa BCV debe ser un número positivo." }),
  amountEuros: z.coerce.number(),
  settledMonths: z.array(z.string()).min(1, { message: "Debes seleccionar al menos un mes." }),
  documents: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

export const taxRecordWithIdSchema = taxRecordSchema.extend({
  id: z.string().min(1),
});

export type TaxRecordFormValues = z.infer<typeof taxRecordSchema>;
export type TaxRecordWithIdFormValues = z.infer<typeof taxRecordWithIdSchema>;


export type TaxRecord = {
  id: string;
  paymentDate: string;
  description: string;
  receiptNumber: string;
  amountBolivares: number;
  bcvRate: number;
  amountEuros: number;
  settledMonths: string[];
  documents?: string[];
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export const authorizedActivitySchema = z.object({
  code: z.string().min(1, 'El código es requerido.'),
  description: z.string().min(1, 'La descripción es requerida.'),
  aliquot: z.coerce.number().min(0, 'La alícuota no puede ser negativa.'),
  taxableMinimum: z.coerce.number().min(0, 'El mínimo imputable no puede ser negativo.'),
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
  taxpayerLicenseId: z.string().min(1, 'El ID de contribuyente es requerido.'),
  issueDate: z.string().min(1, 'La fecha de emisión es requerida.'),
  expirationDate: z.string().min(1, 'La fecha de vencimiento es requerida.'),
  
  authorizedActivities: z.array(authorizedActivitySchema).min(1, 'Debe haber al menos un rubro autorizado.'),
  documents: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

export const economicLicenseWithIdSchema = economicLicenseSchema.extend({
  id: z.string().min(1),
});

export type EconomicLicenseFormValues = z.infer<typeof economicLicenseSchema>;
export type EconomicLicenseWithIdFormValues = z.infer<typeof economicLicenseWithIdSchema>;

export type EconomicLicense = EconomicLicenseFormValues & {
  id: string;
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};

export const operatingExpenseSchema = z.object({
  date: z.string().min(1, { message: "La fecha es requerida." }),
  description: z.string().min(3, { message: "La descripción debe tener al menos 3 caracteres." }),
  category: z.string().min(3, { message: "La categoría debe tener al menos 3 caracteres." }),
  amount: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
  documents: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

export const operatingExpenseWithIdSchema = operatingExpenseSchema.extend({
  id: z.string().min(1),
});

export type OperatingExpenseFormValues = z.infer<typeof operatingExpenseSchema>;

export type OperatingExpense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  documents?: string[];
  userId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};


export const settingsSchema = z.object({
  companyName: z.string().optional(),
  logoUrl: z.string().url('URL de logo inválida.').or(z.literal('')).optional(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export type Settings = {
  id: string;
  companyName?: string;
  logoUrl?: string;
  userId: string;
};
