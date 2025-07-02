'use server';
/**
 * @fileOverview Implements a simple chat flow.
 *
 * - actAsAiAgent - A function that processes user prompts.
 * - ActAsAiAgentInput - The input type for the actAsAiAgent function.
 * - ActAsAiAgentOutput - The return type for the actAsAiAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActAsAiAgentInputSchema = z.object({
  userPrompt: z.string().describe('The user prompt.'),
  model: z.string().optional().describe('The model to use for the response.'),
  knowledgeBase: z
    .string()
    .optional()
    .describe('Knowledge base to use for the response.'),
  attachmentDataUri: z
    .string()
    .optional()
    .describe(
      "An optional attachment (image or document) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ActAsAiAgentInput = z.infer<typeof ActAsAiAgentInputSchema>;

const ActAsAiAgentOutputSchema = z.object({
  response: z.string().describe('The AI response to the prompt.'),
});
export type ActAsAiAgentOutput = z.infer<typeof ActAsAiAgentOutputSchema>;

export async function actAsAiAgent(input: ActAsAiAgentInput): Promise<ActAsAiAgentOutput> {
  return actAsAiAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'actAsAiAgentPrompt',
  input: {schema: ActAsAiAgentInputSchema},
  output: {schema: ActAsAiAgentOutputSchema},
  system: `You are an AI assistant. Your goal is to help the user with their requests.`,
  prompt: `{{#if knowledgeBase}}
Use the following knowledge base to answer the user's question.
Knowledge Base:
{{{knowledgeBase}}}
{{/if}}

{{#if attachmentDataUri}}
The user has provided the following attachment. Use it as the primary context for responding to the user's prompt.
Attachment:
{{media url=attachmentDataUri}}
{{/if}}

User Prompt: {{{userPrompt}}}
  `,
});

const actAsAiAgentFlow = ai.defineFlow(
  {
    name: 'actAsAiAgentFlow',
    inputSchema: ActAsAiAgentInputSchema,
    outputSchema: ActAsAiAgentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: input.model });
    return output!;
  }
);
