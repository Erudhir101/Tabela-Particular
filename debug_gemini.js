const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
const envPath = path.join(__dirname, ".env.local");
let apiKey = process.env.GEMINI_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/GEMINI_API_KEY=(.*)/);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error("GEMINI_API_KEY not found.");
  process.exit(1);
}

console.log("Using API Key: " + apiKey.substring(0, 5) + "...");

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
        console.error("API Error:", JSON.stringify(data.error, null, 2));
        return;
    }

    if (!data.models) {
        console.log("No models returned. Response:", data);
        return;
    }

    console.log("Available Models:");
    data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
             console.log(`- ${m.name.replace("models/", "")}`);
        }
    });

  } catch (error) {
    console.error("Network Error:", error);
  }
}

listModels();