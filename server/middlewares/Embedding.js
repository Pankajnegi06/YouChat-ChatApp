import OpenAI from "openai";
import { Message } from "../models/message.model.js";
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function generateEmbeddingForMessage(message) {
    if (message.messageType !== "text") {
        // For non-text messages, ensure embedding is set to default
        message.embedding = [];
        await message.save();
        return;
    }

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message.content
        });

        const embeddingVector = response.data[0].embedding;
        message.embedding = embeddingVector;
        await message.save();
        console.log("✅ embedding saved for message:", message._id);
    } catch (error) {
        console.error("❌ error generating embedding:", error);
        // Even if embedding fails, set to default and save
        message.embedding = [];
        await message.save();
        console.log("⚠️ Set default embedding due to API error");
    }
}
export { generateEmbeddingForMessage };