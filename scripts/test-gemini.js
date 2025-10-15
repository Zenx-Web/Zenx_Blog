import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Provide a two sentence summary of today's most interesting technology trend.";

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Gemini response:\n");
    console.log(text.trim());
  } catch (error) {
    console.error("Gemini request failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Unexpected error:");
  console.error(error);
  process.exitCode = 1;
});
