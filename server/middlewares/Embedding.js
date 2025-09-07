import OpenAI from "openai";
import { Message } from "../models/message.model.js";
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function generateEmbeddingForMessage(message) {
    if (message.messageType !== "text") return; // only embed text

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message.content
        });

        const embeddingVector = response.data[0].embedding;

        message.embedding = embeddingVector; // ✅ Fixed: use embeddingVector instead of embedding.data[0].embedding
        await message.save();
        console.log("✅ embedding saved for message:", message._id);
    } catch (error) {
        console.error("❌ error generating embedding:", error);
    }
}
export { generateEmbeddingForMessage };