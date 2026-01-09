import { z } from "zod";

export const taxRecordSchema = z.object({
  paymentDate: z.string().min(1, { message: "La fecha es requerida." }),
  description: z.string().min(3, { message: "La descripción debe tener al menos 3 caracteres." }),
  amountBolivares: z.coerce.number().positive({ message: "El monto debe ser un número positivo." }),
  bcvRate: z.coerce.number().positive({ message: "La tasa BCV debe ser un número positivo." }),
  amountEuros: z.coerce.number(), // This will be calculated and set, but good to have in the schema
});

export type TaxRecordFormValues = z.infer<typeof taxRecordSchema>;

export type TaxRecord = {
  id: string;
  paymentDate: string;
  description: string;
  amountBolivares: number;
  bcvRate: number;
  amountEuros: number;
  documentUrl: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
};
