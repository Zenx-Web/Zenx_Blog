import fs from "fs";
import path from "path";
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;

    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    if (!key || !value) continue;

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnv();
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const { generateBlogWithChatGPT } = await import("../src/lib/ai");

  console.log("Testing generateBlogWithChatGPT using gpt-4o-mini...");

  const result = await generateBlogWithChatGPT({
    topic: "California Will Stop Using Coal as a Power Source Next Month",
    category: "technology",
    tone: "engaging",
    length: "medium",
    includeImages: false,
    seoOptimized: true,
  });

  console.log("Title:", result.title);
  console.log("Excerpt:", result.excerpt);
  console.log("Tags:", result.tags.join(", "));
}

main().catch((error) => {
  console.error("OpenAI test failed:");
  console.error(error);
  process.exitCode = 1;
});
