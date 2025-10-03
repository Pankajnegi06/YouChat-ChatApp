import { Message } from "../models/message.model.js";
import dotenv from "dotenv";
import { generateEmbeddingForMessage } from "../middlewares/Embedding.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

export const searchRag = async (req, res) => {
  try {
    const { query } = req.body;
    console.log(query)
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Basic small-talk detection (no RAG needed)
    const normalized = String(query).trim().toLowerCase();
    const smallTalkMap = {
      "hi": "Hi! How can I help you with your chat history today?",
      "hello": "Hello! What would you like to know about your chats?",
      "hey": "Hey! How can I assist you?",
      "good morning": "Good morning! How can I help?",
      "good afternoon": "Good afternoon! What can I help you find?",
      "good evening": "Good evening! What can I do for you?",
      "thanks": "You're welcome!",
      "thank you": "You're welcome!",
      "bye": "Goodbye! Feel free to come back with more questions.",
    };
    const smallTalkKey = Object.keys(smallTalkMap).find((k) => normalized === k || normalized.startsWith(k + "!"));
    if (smallTalkKey) {
      return res.json({ answer: smallTalkMap[smallTalkKey], context: [] });
    }

    // 1. Embed the query (Gemini embeddings)
    const queryVector = await generateEmbeddingForMessage(query);

    // 2. Search similar messages in MongoDB (Atlas Vector Search)
    const similarMessages = await Message.aggregate([
      {
        $vectorSearch: {
          index: "default",
          queryVector,
          path: "embedding",
          numCandidates: 50,
          limit: 5,
        },
      },
    ]);
    console.log(similarMessages)
    const context = similarMessages.map((m) => m.content).join("\n");

    // If no relevant documents found, respond politely without hallucinating
    if (!similarMessages || similarMessages.length === 0) {
      return res.json({
        answer:
          "I couldn't find anything relevant in your chat history for that. Could you share a bit more detail?",
        context: [],
      });
    }

    // 3. Ask Gemini 2.5 Pro with retrieved context
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const prompt = `
      You are a helpful assistant. Use ONLY the provided chat history; if it's not relevant, say you don't have enough information about the user's chat history.
      Keep responses concise, friendly, and not creepy. Do not fabricate details.

      User query: "${query}"

      Relevant messages from chat history (may be partial):
      ${context}
    `;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();
    console.log(answer)
    // 4. Send back the answer
    res.json({ answer, context: similarMessages });
  } catch (err) {
    console.error("Error in /ask route:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
