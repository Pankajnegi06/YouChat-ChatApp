import { Message } from "../models/message.model.js";
import dotenv from "dotenv";
import { generateQueryEmbedding } from "../middlewares/Embedding.js";
import Groq from "groq-sdk";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const searchRag = async (req, res) => {
  try {
    const { query } = req.body;
    console.log(query);

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Small talk detection
    const normalized = String(query).trim().toLowerCase();
    const smallTalkMap = {
      hi: "Hi! How can I help you with your chat history today?",
      hello: "Hello! What would you like to know about your chats?",
      hey: "Hey! How can I assist you?",
      "good morning": "Good morning! How can I help?",
      "good afternoon": "Good afternoon! What can I help you find?",
      "good evening": "Good evening! What can I do for you?",
      thanks: "You're welcome!",
      "thank you": "You're welcome!",
      bye: "Goodbye! Feel free to come back with more questions.",
    };

    const smallTalkKey = Object.keys(smallTalkMap).find(
      (k) => normalized === k || normalized.startsWith(k + "!")
    );

    if (smallTalkKey) {
      return res.json({ answer: smallTalkMap[smallTalkKey], context: [] });
    }

    // 1. Query → Embedding
    const queryVector = await generateQueryEmbedding(query);

    // 2. MongoDB vector search
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

    console.log(similarMessages);

    const context = similarMessages.map((m) => m.content).join("\n");

    if (!similarMessages || similarMessages.length === 0) {
      return res.json({
        answer:
          "I couldn't find anything relevant in your chat history. Could you share more details?",
        context: [],
      });
    }

    // 3. GROQ LLM call
    const prompt = `
You are a helpful assistant. Use ONLY the provided chat history.
If the chat history is not relevant, say you don't have enough information.
Keep responses short, friendly, and never hallucinate.

User query: "${query}"

Relevant messages from chat history:
${context}
`;

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3-32b", // or "llama-3.1-405b"
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const rawAnswer = completion.choices[0].message.content;
    // Strip thinking tags from response
    const answer = rawAnswer.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    console.log(answer);

    res.json({ answer, context: similarMessages });
  } catch (err) {
    console.error("Error in /ask route:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};
