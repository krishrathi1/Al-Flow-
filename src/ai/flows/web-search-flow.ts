
'use server';
/**
 * @fileOverview A Genkit flow for performing a web search and synthesizing an answer.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleSearchTool } from '@/ai/tools/google-search';

const WebSearchInputSchema = z.object({
  query: z.string().describe('The user\'s search query.'),
});
export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

const WebSearchOutputSchema = z.object({
  response: z.string().describe('The synthesized answer from the web search results.'),
});
export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

export async function webSearch(input: WebSearchInput): Promise<WebSearchOutput> {
  return webSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'webSearchPrompt',
  input: {schema: WebSearchInputSchema},
  output: {schema: WebSearchOutputSchema},
  tools: [googleSearchTool],
  system: `You are an intelligent web search assistant. Your task is to answer the user's query based on the information you find using the provided Google Search tool.

Follow these steps:
1.  Use the 'googleSearch' tool with the user's query to get a list of search results.
2.  Carefully read the titles and snippets from the search results.
3.  Synthesize a comprehensive, well-written answer to the user's original query based *only* on the information provided in the search results.
4.  Do NOT mention that you performed a search or that you are basing your answer on search results. Act as if you know the information.
5.  Do NOT include any links or cite any sources. Just provide the direct answer.
6.  If the search results do not provide enough information to answer the question, simply state that you could not find a definitive answer on the web.`,
  prompt: `Query: {{{query}}}`,
});

const webSearchFlow = ai.defineFlow(
  {
    name: 'webSearchFlow',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async input => {
    // The model will automatically decide to use the googleSearchTool.
    const llmResponse = await prompt(input, { model: 'googleai/gemini-2.0-flash' });
    const output = llmResponse.output;

    if (!output) {
      throw new Error("The AI failed to generate a response.");
    }
    
    return {
        response: output.response,
    };
  }
);
