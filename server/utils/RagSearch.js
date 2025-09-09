import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI.create({ApiKey:process.env.OPENAI_API_KEY});

async function searchRag(req,res){
    try{
    const {query} = req.body;
    if(!query){
        return res.status(400).json({message : "query is required"});
    }
    const vectorEmbedding = await openai.embeddings.create({
        model:"text-embedding-3-small",
        input:query
    });
    const queryvector = vectorEmbedding.data[0].embedding;

    const similarDocuments = await Message.aggregate([
        {$vectorSearch:{
            index : "vector_index",
            path : "embedding",
            limit:10,
            queryVector:queryvector,
            numCandidates:50
        }
    }
    ])
    const context = similarDocuments.map(m=>m.content).join("\n");

    const completions = await openai.chat.completions.create({
        model:"gpt-4o-mini",
        message:[{
            role:"system",content:"You are a helpful assistant that can answer based on chat history"
        },
    {
        role:"user",content:`User asked : ${query}\n\n Relevant message:\n ${context}`
    }]
    })

    return res.status(200).json({answer:completions.choices[0].message.content,retrieved : similarDocuments});

} catch(error){
    console.error("Error searching RAG:", error);
    return res.status(500).json({message:"Error searching RAG"});
}
}

export { searchRag };