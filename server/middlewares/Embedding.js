import dotenv from "dotenv";
import { Message } from "../models/message.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

// Helper to create embeddings with Gemini
async function createEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values; // ✅ returns array of floats
  } catch (error) {
    console.error("❌ Error creating embedding:", error);
    return [];
  }
}

async function generateEmbeddingForMessage(message) {
  // Case 1: raw string
  if (typeof message === "string") {
    return await createEmbedding(message);
  }

  // Case 2: Message object from MongoDB
  if (message.messageType !== "text") {
    message.embedding = [];
    await message.save();
    return;
  }

  try {
    const embeddingVector = await createEmbedding(message.content);
    message.embedding = embeddingVector;
    await message.save();
    console.log("✅ Embedding saved for message:", message._id);
  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    message.embedding = [];
    await message.save();
    console.log("⚠️ Set default embedding due to API error");
  }
}

export { generateEmbeddingForMessage };
