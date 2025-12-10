import { Server as SocketIoServer } from "socket.io";
import { Message } from "./models/message.model.js";
import { Group } from "./models/group.model.js";
import { generateEmbeddingForMessage } from "./middlewares/Embedding.js";

export const userSocketMap = new Map();
let ioInstance = null;

export const getIo = () => ioInstance;

export const setupSocket = (server) => {
    const io = new SocketIoServer(server, {
        cors: {
            origin: ['http://localhost:5173','https://youchat-chatapp.onrender.com','https://youchat-chatapp.vercel.app'],
            credentials: true,
            methods: ['GET', 'POST'],
        }
    });
    
    // Store io instance for use in other modules
    ioInstance = io;

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
                console.log('Received sendMessage:', message);
                
                const senderSocketId = userSocketMap.get(message.sender);
                
                // Flatten receiver array in case it's nested like [[id]] instead of [id]
                let receiverIds = Array.isArray(message.receiver) ? message.receiver.flat() : [message.receiver];
                console.log('Receiver IDs after flattening:', receiverIds);
                
                // Fix message.receiver before saving
                message.receiver = receiverIds;
        
                const newMessage = new Message(message);
                const savedMessage = await newMessage.save();
                await generateEmbeddingForMessage(savedMessage);
                
                // Get populated message, but preserve original receiver IDs
                let messageData = await Message.findById(savedMessage._id)
                    .populate("receiver", "id image firstName lastName email color")
                    .populate("sender", "id image firstName lastName email color");
                
                // Convert to object so we can modify it
                messageData = messageData.toObject();
                
                // If receiver array is empty after populate (happens for group IDs), 
                // restore the original receiver IDs
                if (!messageData.receiver || messageData.receiver.length === 0) {
                    messageData.receiver = receiverIds;
                    console.log('Restored original receiverIds for group message:', receiverIds);
                }
                
                console.log('Broadcasting message to sender socket:', senderSocketId);
                
                // Send to sender
                if (senderSocketId) {
                    io.to(senderSocketId).emit("receiveMessages", messageData);
                }
                
                // Check if receiver is a group or individual users
                for (const rid of receiverIds) {
                    // Convert ID to string for consistent comparison with socket map
                    const id = typeof rid === 'object' && rid !== null 
                        ? (rid._id || rid.id || rid).toString() 
                        : String(rid);
                    
                    console.log('Processing receiver ID:', id);
                    
                    // First try to find as a user socket
                    const recSock = userSocketMap.get(id);
                    
                    if (recSock && recSock !== senderSocketId) {
                        // It's a regular user
                        console.log('Broadcasting to user socket:', recSock);
                        io.to(recSock).emit("receiveMessages", messageData);
                    } else {
                        // Check if this ID is a group
                        try {
                            const group = await Group.findById(id);
                            if (group) {
                                console.log('Receiver is a group:', group.name, 'with members:', group.members.length);
                                // Broadcast to all group members
                                for (const memberId of group.members) {
                                    const memberIdStr = memberId.toString();
                                    const senderIdStr = message.sender?.toString() || message.sender;
                                    if (memberIdStr !== senderIdStr) {
                                        const memberSocket = userSocketMap.get(memberIdStr);
                                        if (memberSocket) {
                                            console.log('Broadcasting to group member:', memberIdStr);
                                            io.to(memberSocket).emit("receiveMessages", messageData);
                                        }
                                    }
                                }
                            }
                        } catch (groupErr) {
                            // Not a valid group ID, ignore
                            console.log('Receiver is not a user or group:', id);
                        }
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
