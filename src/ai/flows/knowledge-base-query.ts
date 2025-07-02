'use server';

/**
 * @fileOverview This file defines a Genkit flow for querying a knowledge base.
 *
 * - knowledgeBaseQueryFlow: The main flow function that takes a query and retrieves information from the knowledge base.
 * - KnowledgeBaseQueryInput: The input type for the knowledgeBaseQueryFlow function.
 * - KnowledgeBaseQueryOutput: The output type for the knowledgeBaseQueryFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KnowledgeBaseQueryInputSchema = z.object({
  query: z.string().describe('The query to be used to retrieve information from the knowledge base.'),
  knowledgeBase: z.string().describe('The information present in the knowledge base.'),
  model: z.string().optional().describe('The model to use for the response.'),
});
export type KnowledgeBaseQueryInput = z.infer<typeof KnowledgeBaseQueryInputSchema>;

const KnowledgeBaseQueryOutputSchema = z.object({
  response: z.string().describe('The response from the AI based on the knowledge base.'),
});
export type KnowledgeBaseQueryOutput = z.infer<typeof KnowledgeBaseQueryOutputSchema>;

export async function knowledgeBaseQuery(input: KnowledgeBaseQueryInput): Promise<KnowledgeBaseQueryOutput> {
  return knowledgeBaseQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'knowledgeBaseQueryPrompt',
  input: {schema: KnowledgeBaseQueryInputSchema},
  output: {schema: KnowledgeBaseQueryOutputSchema},
  prompt: `You are a helpful AI assistant that uses the provided knowledge base to answer questions.

Knowledge Base:
{{{knowledgeBase}}}

Query: {{{query}}}

Response:`,
});

const knowledgeBaseQueryFlow = ai.defineFlow(
  {
    name: 'knowledgeBaseQueryFlow',
    inputSchema: KnowledgeBaseQueryInputSchema,
    outputSchema: KnowledgeBaseQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: input.model });
    return output!;
  }
);
