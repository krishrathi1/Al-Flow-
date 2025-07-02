'use server';

import { z } from 'zod';

const PromptEnhanceInputSchema = z.object({
  prompt: z.string().describe('The text prompt.'),
  attachmentDataUri: z.string().optional().describe("An image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type PromptEnhanceInput = z.infer<typeof PromptEnhanceInputSchema>;

const PromptEnhanceOutputSchema = z.object({
  response: z.string().describe('The enhanced prompt or description.'),
});
export type PromptEnhanceOutput = z.infer<typeof PromptEnhanceOutputSchema>;

const OpenRouterResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
    }),
  })),
});

export async function enhancePrompt(input: PromptEnhanceInput): Promise<PromptEnhanceOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY_PROMPT_ENHANCE;
  if (!apiKey) {
    throw new Error('The OPENROUTER_API_KEY_PROMPT_ENHANCE environment variable is not set. Please add it to your .env file.');
  }
  
  const messages: any[] = [];

  if (input.attachmentDataUri) {
    // Mode 1: Describe image
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: input.prompt || 'Describe this image in detail.',
        },
        {
          type: 'image_url',
          image_url: {
            url: input.attachmentDataUri,
          },
        },
      ],
    });
  } else {
    // Mode 2: Enhance prompt (text only)
    messages.push({
        role: 'user',
        content: `You are a prompt engineering expert. Enhance the following prompt to be more descriptive and creative for an image generation AI. Make it vivid, detailed, and visually rich. Do not add any conversational fluff, just output the enhanced prompt.

Original Prompt: "${input.prompt}"`
    });
  }


  const body = {
    model: 'google/gemma-3-27b-it:free',
    messages,
  };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aiflow.dev",
        "X-Title": "AI Flow",
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed for Prompt Enhancer. Please ensure your specific OpenRouter API key is correct and set in the .env file.");
      }
      let errorDetails = `API request failed with status ${response.status} ${response.statusText}.`;
      try {
          const errorBody = await response.json();
          console.error("OpenRouter API Error Response Body:", errorBody);
          const message = errorBody.error?.message || JSON.stringify(errorBody);
          errorDetails += ` Details: ${message}`;
      } catch (e) {
          const errorText = await response.text();
          console.error("OpenRouter API Error Response Text:", errorText);
          errorDetails += ` Body: ${errorText}`;
      }
      throw new Error(errorDetails);
    }

    const data = await response.json();
    const parsedData = OpenRouterResponseSchema.safeParse(data);

    if (!parsedData.success) {
        console.error("OpenRouter API Error Response Body:", data);
        console.error("Zod parsing error:", parsedData.error);
        const errorMessage = data.error?.message || "Invalid response structure from OpenRouter API.";
        throw new Error(errorMessage);
    }

    if (parsedData.data.choices && parsedData.data.choices.length > 0 && parsedData.data.choices[0].message.content) {
      return { response: parsedData.data.choices[0].message.content };
    } else {
      throw new Error("Invalid response structure from OpenRouter API");
    }

  } catch (error) {
    console.error("Failed to fetch from OpenRouter:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
}
