import { Message } from "../models/message.model.js";

// Use bge-base which produces 768-dimensional embeddings
const HF_API_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-base-en-v1.5";

// Helper function to call Hugging Face API
async function getEmbeddingFromHF(text) {
    const response = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`HF API Error: ${response.status} - ${error}`);
    }

    const embedding = await response.json();
    return embedding;
}

async function generateEmbeddingForMessage(message) {
    if (message.messageType !== "text") return; // Only embed text messages

    try {
        const embedding = await getEmbeddingFromHF(message.content);
        message.embedding = embedding;
        await message.save();
        console.log("✅ Embedding saved for message:", message._id);
    } catch (error) {
        console.error("❌ Error generating embedding:", error);
    }
}

// Generate embedding for a plain text query (for RAG search)
async function generateQueryEmbedding(text) {
    try {
        const embedding = await getEmbeddingFromHF(text);
        return embedding;
    } catch (error) {
        console.error("❌ Error generating query embedding:", error);
        return null;
    }
}

export { generateEmbeddingForMessage, generateQueryEmbedding };


