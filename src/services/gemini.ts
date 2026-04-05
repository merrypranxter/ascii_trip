import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateAsciiFromPrompt(prompt: string, activeSets: string[]) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a weird, trippy, and creative ASCII art piece based on this prompt: "${prompt}". 
    Use characters from these sets: ${activeSets.join(', ')}. 
    Make it abstract and artistic. Return ONLY the ASCII art, no extra text. 
    Wrap it in a markdown code block.`,
  });

  const response = await model;
  return response.text || "Failed to generate art.";
}
