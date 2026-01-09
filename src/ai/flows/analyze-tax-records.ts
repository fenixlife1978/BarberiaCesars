'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing tax records and generating a summary report.
 *
 * It includes:
 * - analyzeTaxRecords: An async function that takes tax record data and returns an analysis report.
 * - AnalyzeTaxRecordsInput: The input type for the analyzeTaxRecords function.
 * - AnalyzeTaxRecordsOutput: The output type for the analyzeTaxRecords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTaxRecordsInputSchema = z.object({
  taxRecords: z.array(
    z.object({
      date: z.string().describe('Date of the tax payment (YYYY-MM-DD).'),
      description: z.string().describe('Description of the tax payment.'),
      amountBolivares: z.number().describe('Amount paid in Bolivares.'),
      bcvRate: z.number().describe('BCV exchange rate on the day of payment.'),
      amountEuros: z.number().describe('Equivalent amount in Euros.'),
    })
  ).describe('Array of tax payment records.'),
});

export type AnalyzeTaxRecordsInput = z.infer<typeof AnalyzeTaxRecordsInputSchema>;

const AnalyzeTaxRecordsOutputSchema = z.object({
  report: z.string().describe('A summary report of the tax payments, including identified patterns and possible improvements.'),
});

export type AnalyzeTaxRecordsOutput = z.infer<typeof AnalyzeTaxRecordsOutputSchema>;

export async function analyzeTaxRecords(input: AnalyzeTaxRecordsInput): Promise<AnalyzeTaxRecordsOutput> {
  return analyzeTaxRecordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTaxRecordsPrompt',
  input: {schema: AnalyzeTaxRecordsInputSchema},
  output: {schema: AnalyzeTaxRecordsOutputSchema},
  prompt: `You are an expert accountant analyzing tax payment records to identify patterns and suggest improvements.

  Analyze the following tax records and generate a short report summarizing the payments and identifying any notable patterns or potential areas for fiscal improvement.

  Tax Records:
  {{#each taxRecords}}
  - Date: {{date}}, Description: {{description}}, Amount (Bolivares): {{amountBolivares}}, BCV Rate: {{bcvRate}}, Amount (Euros): {{amountEuros}}
  {{/each}}
  `,
});

const analyzeTaxRecordsFlow = ai.defineFlow(
  {
    name: 'analyzeTaxRecordsFlow',
    inputSchema: AnalyzeTaxRecordsInputSchema,
    outputSchema: AnalyzeTaxRecordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
