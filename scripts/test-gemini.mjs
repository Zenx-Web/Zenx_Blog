import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

function loadEnv() {
  if (process.env.GEMINI_API_KEY) return;

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;

    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    if (!key || !value) continue;

    if (!process.env[key] && (key === "GEMINI_API_KEY" || key === "GOOGLE_GEMINI_API_KEY")) {
      process.env[key] = value;
    }
  }
}

async function resolveModel(apiKey) {
  if (process.env.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }

  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(listUrl);
    if (!response.ok) {
      return "gemini-1.5-flash";
    }

    const payload = await response.json();
    const candidates = payload?.models ?? [];
    const preferred = candidates.find((model) =>
      model?.supportedGenerationMethods?.includes("generateContent"),
    );

    const resolved = preferred?.name ?? preferred?.displayName;
    if (!resolved) {
      return "gemini-1.5-flash";
    }

    return resolved.replace(/^models\//, "");
  } catch (error) {
    console.warn("Unable to list Gemini models:", error);
    return "gemini-1.5-flash";
  }
}

async function main() {
  loadEnv();
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const modelName = await resolveModel(apiKey);
  const model = client.getGenerativeModel({ model: modelName });

  const prompt = "Provide a two sentence summary of today's most interesting technology trend.";

  try {
    console.log(`Using Gemini model: ${modelName}`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Gemini response:\n");
    console.log(text.trim());
  } catch (error) {
    console.error("Gemini request failed:");
    console.error(error);
    if (error?.status === 429) {
      console.error("Gemini API quota exceeded. Check billing/quota settings in Google AI Studio.");
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Unexpected error:");
  console.error(error);
  process.exitCode = 1;
});
