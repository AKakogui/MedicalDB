'use server';

/**
 * @fileOverview Generates a smart summary of uploaded medical records.
 *
 * - generateSmartMedicalSummary - A function that generates a smart summary of medical records.
 * - GenerateSmartMedicalSummaryInput - The input type for the generateSmartMedicalSummary function.
 * - GenerateSmartMedicalSummaryOutput - The return type for the generateSmartMedicalSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSmartMedicalSummaryInputSchema = z.object({
  medicalRecords: z
    .string()
    .describe(
      'The medical records to summarize.  This can include prescriptions, X-rays, CT scans, MRI scans, lab results, doctor visit notes, and other relevant medical information.'
    ),
});
export type GenerateSmartMedicalSummaryInput = z.infer<typeof GenerateSmartMedicalSummaryInputSchema>;

const GenerateSmartMedicalSummaryOutputSchema = z.object({
  summary: z.string().describe('A smart summary of the medical records.'),
  flaggedFacts: z
    .array(z.string())
    .describe('A list of potentially important facts flagged for user review.'),
});
export type GenerateSmartMedicalSummaryOutput = z.infer<typeof GenerateSmartMedicalSummaryOutputSchema>;

export async function generateSmartMedicalSummary(
  input: GenerateSmartMedicalSummaryInput
): Promise<GenerateSmartMedicalSummaryOutput> {
  return generateSmartMedicalSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSmartMedicalSummaryPrompt',
  input: {schema: GenerateSmartMedicalSummaryInputSchema},
  output: {schema: GenerateSmartMedicalSummaryOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing medical records.

You will receive a collection of medical records, including prescriptions, X-rays, CT scans, MRI scans, lab results, doctor visit notes, and other relevant medical information.

Your goal is to generate a concise and informative summary of these records, highlighting the key medical details and identifying potentially important facts that the user should review.

Medical Records: {{{medicalRecords}}}

Summary:
`,
});

const generateSmartMedicalSummaryFlow = ai.defineFlow(
  {
    name: 'generateSmartMedicalSummaryFlow',
    inputSchema: GenerateSmartMedicalSummaryInputSchema,
    outputSchema: GenerateSmartMedicalSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
