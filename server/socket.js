import { Server as SocketIoServer } from "socket.io";
import { Message } from "./models/message.model.js";
import { generateEmbeddingForMessage } from "./middlewares/Embedding.js";

const userSocketMap = new Map();

export const setupSocket = (server) => {
    const io = new SocketIoServer(server, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
            methods: ['GET', 'POST'],
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
        } else {
            console.log("User ID not provided during connection.");
        }

        socket.on("disconnect", () => {
            console.log(`Client Disconnected: ${socket.id}`);

            // Remove the user associated with this socket
            for (const [userId, socketId] of userSocketMap.entries()) { 
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    break;
                }
            }
        });

        socket.on("sendMessage", async (message, ack) => {
            try {
                console.log(message)
                const senderSocketId = userSocketMap.get(message.sender);
                const receiverIds = Array.isArray(message.receiver) ? message.receiver : [message.receiver];
        
                const newMessage = new Message(message);
                const savedMessage = await newMessage.save();
                await generateEmbeddingForMessage(savedMessage);
                
        
                const messageData = await Message.findById(savedMessage._id)
                    .populate("receiver", "id image firstName lastName email color")
                    .populate("sender", "id image firstName lastName email color");
                
                
                if (senderSocketId) {
                    io.to(senderSocketId).emit("receiveMessages", messageData);
                }
                for (const rid of receiverIds) {
                    const id = typeof rid === 'object' && rid !== null ? rid._id || rid.id : rid;
                    const recSock = userSocketMap.get(id);
                    if (recSock) {
                        io.to(recSock).emit("receiveMessages", messageData);
                    }
                }
                if (typeof ack === 'function') ack({ ok: true, id: savedMessage._id });
            } catch (err) {
                console.error("Error handling message event:", err);
                if (typeof ack === 'function') ack({ ok: false });
            }
        });
        
    });

    return io;  
};
