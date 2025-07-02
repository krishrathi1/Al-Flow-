'use server';

import { z } from 'zod';

const OpenRouterResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
    }),
  })),
});

interface OpenRouterChatInput {
  userPrompt: string;
  model: string;
  attachmentDataUri?: string;
}

const getApiKeyForModel = (model: string): string | undefined => {
  switch (model) {
    case 'meta-llama/llama-4-maverick:free':
      return process.env.OPENROUTER_API_KEY_LLAMA4;
    case 'deepseek/deepseek-r1-0528:free':
      return process.env.OPENROUTER_API_KEY_DEEPSEEK_R1;
    case 'deepseek/deepseek-chat:free':
      return process.env.OPENROUTER_API_KEY_DEEPSEEK_V3;
    case 'qwen/qwen3-235b-a22b:free':
        return process.env.OPENROUTER_API_KEY_QWEN;
    case 'nvidia/llama-3.3-nemotron-super-49b-v1:free':
      return process.env.OPENROUTER_API_KEY_NVIDIA;
    case 'mistralai/mistral-small-3.1-24b-instruct:free':
      return process.env.OPENROUTER_API_KEY_MISTRAL_SMALL;
    default:
      // Fallback for any other models that might use a generic key
      return process.env.OPENROUTER_API_KEY;
  }
};

export async function openRouterChat(input: OpenRouterChatInput): Promise<{ response: string }> {
  const apiKey = getApiKeyForModel(input.model);
  if (!apiKey) {
    throw new Error(`The API key for the selected model (${input.model}) is not set. Please add the appropriate environment variable to your .env file.`);
  }

  let messageContent: any[] | string;
  if (input.attachmentDataUri) {
    messageContent = [
        { type: "text", text: input.userPrompt },
        { type: "image_url", image_url: { url: input.attachmentDataUri } },
    ];
  } else {
    messageContent = input.userPrompt;
  }

  const messages: any[] = [
    { role: 'user', content: messageContent }
  ];

  const body = {
    model: input.model,
    messages: messages,
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
        throw new Error("Authentication failed. Please ensure your OpenRouter API key is correct, has funds, and is set in the .env file for the selected model.");
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
