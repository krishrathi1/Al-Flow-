
'use server';

import { z } from 'zod';
import Together from "together-ai";

// Directly embedding the API key as requested.
// IMPORTANT: For production, use process.env.TOGETHER_API_KEY
const API_KEY = "042e1ae40513929bf19dceb4cb15bbb8acfad4402074f70f2d4b10ccfe65f83f";

// Initialize the Together AI client with the provided API key
const together = new Together({
  apiKey: API_KEY,
});

// Zod schema for validating the input prompt and model
const TogetherImageRequestSchema = z.object({
  // Keeping prompt as an empty string as requested, but typically you'd want a meaningful prompt.
  prompt: z.string().default(""), // Default to empty string as per user's snippet
  model: z.string().default("black-forest-labs/FLUX.1-schnell-Free"),
  // You can add other parameters here if your UI allows them and the model supports them,
  // e.g., steps: z.number().default(20), width: z.number().default(1024), height: z.number().default(1024),
  // n: z.number().default(1),
});

/**
 * Generates an image using the Together AI API.
 * @param {string} prompt - The text prompt for image generation.
 * @returns {Promise<{ imageDataUri: string }>} A promise that resolves with the Data URI of the generated image.
 * @throws {Error} If the API key is missing, the request fails, or no image data is received.
 */
export async function generateTogetherImage(prompt: string): Promise<{ imageDataUri: string }> {
  // Check if the API key is provided (even though it's hardcoded here, this check is good practice)
  if (!API_KEY) {
    throw new Error('The Together AI API key is not set. Please provide it.');
  }

  try {
    // Validate the input prompt using Zod
    const validatedInput = TogetherImageRequestSchema.parse({ prompt });

    console.log("Attempting image generation with Together AI...");
    console.log("Model:", validatedInput.model);
    console.log("Prompt:", validatedInput.prompt === "" ? "[Empty Prompt]" : validatedInput.prompt);

    // Make the image generation request using the Together AI SDK
    const response = await together.images.create({
      model: validatedInput.model,
      prompt: validatedInput.prompt,
      n: 1, // As specified in your snippet
      // You can add other parameters here if needed, e.g.:
      // steps: 20,
      // width: 512,
      // height: 512,
    });

    // Log the full response from the SDK for debugging purposes
    console.log("Together AI SDK Full Response:", JSON.stringify(response, null, 2));

    // Check if the response contains the expected image data (either b64_json or url)
    if (response && response.data && response.data.length > 0) {
      // Prioritize 'url' if available, as indicated by the error message
      if ((response.data[0] as any).url) {
        const imageUrl = (response.data[0] as any).url;
        console.log("Image URL received:", imageUrl);
        return { imageDataUri: imageUrl }; // Return the URL directly
      }
      // Fallback to 'b64_json' if 'url' is not present (less likely for this model based on error)
      else if ((response.data[0] as any).b64_json) {
        const base64Image = (response.data[0] as any).b64_json;
        console.log("Base64 image data received.");
        return { imageDataUri: `data:image/png;base64,${base64Image}` };
      }
    }

    // If neither 'url' nor 'b64_json' was found
    let detailedError = "No image data received from Together AI. ";
    if (response && response.data && response.data.length === 0) {
      detailedError += "The 'data' array in the response was empty.";
    } else if (response && response.data && response.data.length > 0) {
      detailedError += `The first item in 'data' did not contain 'url' or 'b64_json'. Found keys: ${Object.keys(response.data[0] || {}).join(', ')}.`;
    } else {
      detailedError += "The API response structure was unexpected (missing 'data' array).";
    }
    throw new Error(detailedError);

  } catch (error) {
    console.error("Failed to generate image with Together AI SDK:", error);
    if (error instanceof Error) {
      // Check for Together AI specific error status
      if ((error as any).status) {
          throw new Error(`Together AI API Error: ${(error as any).message || 'Unknown error'} (Status: ${(error as any).status})`);
      }
      throw error; // Re-throw the original error
    }
    throw new Error("An unexpected error occurred while generating the image.");
  }
}
