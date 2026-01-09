'use server';

/**
 * @fileOverview Flow to generate a tax description based on a short prompt.
 *
 * - generateTaxDescription - A function that generates a tax description.
 * - GenerateTaxDescriptionInput - The input type for the generateTaxDescription function.
 * - GenerateTaxDescriptionOutput - The return type for the generateTaxDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaxDescriptionInputSchema = z.object({
  prompt: z.string().describe('A short prompt to generate a tax description from.'),
});

export type GenerateTaxDescriptionInput = z.infer<
  typeof GenerateTaxDescriptionInputSchema
>;

const GenerateTaxDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated tax description.'),
});

export type GenerateTaxDescriptionOutput = z.infer<
  typeof GenerateTaxDescriptionOutputSchema
>;

export async function generateTaxDescription(
  input: GenerateTaxDescriptionInput
): Promise<GenerateTaxDescriptionOutput> {
  return generateTaxDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaxDescriptionPrompt',
  input: {schema: GenerateTaxDescriptionInputSchema},
  output: {schema: GenerateTaxDescriptionOutputSchema},
  prompt: `You are an expert tax description generator.

  Based on the provided prompt, generate a concise and informative tax description.

  Prompt: {{{prompt}}}
  `,
});

const generateTaxDescriptionFlow = ai.defineFlow(
  {
    name: 'generateTaxDescriptionFlow',
    inputSchema: GenerateTaxDescriptionInputSchema,
    outputSchema: GenerateTaxDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
