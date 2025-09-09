import { Message } from "../models/message.model.js";
import OpenAI from "openai";
import dotenv from "dotenv"
dotenv.config()
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// RAG search + summarization
export const searchRag = async (req, res) => {
  try {
    const { query } = req.body; // e.g., "Summarize today’s chat with John"

    // Step 1: Embed the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });
    const queryVector = embeddingResponse.data[0].embedding;

    // Step 2: Find similar messages from MongoDB
    const similarMessages = await Message.aggregate([
      {
        $vectorSearch: {
          index: "vector_index_messages", // Create this index in Atlas
          queryVector,
          path: "embedding",
          numCandidates: 50,
          limit: 5
        }
      }
    ]);

    // Step 3: Build context for LLM
    const context = similarMessages.map(m => m.content).join("\n");

    // Step 4: Ask LLM with retrieved context
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that answers based on chat history." },
        { role: "user", content: `Query: ${query}\n\nRelevant messages:\n${context}` }
      ]
    });

    res.json({
      answer: completion.choices[0].message.content,
      retrieved: similarMessages
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "RAG search failed" });
  }
};
