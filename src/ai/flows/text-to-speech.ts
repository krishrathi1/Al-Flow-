
'use server';
/**
 * @fileOverview A text-to-speech (TTS) flow that also translates text before synthesis.
 *
 * - textToSpeech - A function that translates text to a target language and then converts it to audible speech.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  languageCode: z.string().optional().describe('The BCP-47 language code for the speech synthesis (e.g., "en-US", "fr-FR"). The input text will be translated to this language before synthesis.'),
});
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    let textToSynthesize = input.text;

    // If a specific language is chosen (and not auto-detect), perform translation first.
    if (input.languageCode && input.languageCode !== 'auto') {
        const translationResult = await ai.generate({
            prompt: `Translate the following text to the language with BCP-47 code "${input.languageCode}". Output only the translated text, without any additional formatting or conversational text.

Input Text:
"""
${input.text}
"""
`,
        });

        const translatedText = translationResult.text;
        if (!translatedText?.trim()) {
            throw new Error('Translation failed or returned empty text. Please try again.');
        }
        textToSynthesize = translatedText.trim();
    }
      
    // Use SSML to specify language for synthesis if a code is provided.
    const promptText =
      input.languageCode && input.languageCode !== 'auto'
        ? `<speak xml:lang="${input.languageCode}">${textToSynthesize}</speak>`
        : textToSynthesize;

    const {media} = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: promptText,
    });
    if (!media) {
      throw new Error('No audio media was returned from the AI.');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
