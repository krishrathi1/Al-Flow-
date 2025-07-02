
'use server';
/**
 * @fileOverview A Genkit tool for performing Google searches.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GoogleSearchInputSchema = z.object({
  query: z.string().describe('The search query.'),
});

// Define the structure of a single search result item
const SearchResultItemSchema = z.object({
    title: z.string(),
    link: z.string(),
    snippet: z.string()
});

// Define the structure of the overall API response
const GoogleSearchResponseSchema = z.object({
    items: z.array(SearchResultItemSchema).optional()
});

export const googleSearchTool = ai.defineTool(
  {
    name: 'googleSearch',
    description: 'Searches Google for the given query and returns the top 5 results. Use this for questions about recent events, current information, or when the user explicitly asks for a web search.',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: z.string().describe("A formatted string of search results, including title, snippet, and link for each result."),
  },
  async (input) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
      return 'The Google Search tool is not configured. The API key or Search Engine ID is missing.';
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(input.query)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Google Search API Error:", errorData);
        return `Google Search API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`;
      }
      
      const data = await response.json();
      const parsedData = GoogleSearchResponseSchema.safeParse(data);

      if (!parsedData.success || !parsedData.data.items || parsedData.data.items.length === 0) {
        return "No relevant search results found for the query.";
      }

      // Format the top 5 results into a single string for the LLM
      const formattedResults = parsedData.data.items.slice(0, 5).map(item => 
        `Title: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`
      ).join('\n---\n');
      
      return formattedResults;
    } catch (error) {
      console.error("Error performing Google search:", error);
      return `An error occurred while trying to search Google.`;
    }
  }
);
