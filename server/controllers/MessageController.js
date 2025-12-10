import { Message } from "../models/message.model.js";
import { fileUpload } from "../utils/cloudinaryUpload.js";
import { Group } from "../models/group.model.js";
import { getIo, userSocketMap } from "../socket.js";

export const getMessagesForContact = async (req, res) => {
    try {
        console.log(req.body);
        
        const user1 = req.user._id;
        const user2 = req.body.id;

        if (!user1 || !user2) {
            return res.status(400).json("Need all user Id");
        }

        const messages = await Message.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 }
            ]
        }).sort({ createdAt: 1 });
          
        return res.status(200).json(messages);
    } catch (error) {
        console.error("getMessagesForContact error", error);
        return res.status(500).json("Internal Server Error");
    }
}

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.body;
        
        if (!groupId) {
            return res.status(400).json({ msg: "Group ID is required" });
        }

        const messages = await Message.find({
            receiver: groupId
        })
        .populate("sender", "firstName lastName email image color")
        .sort({ createdAt: 1 });
          
        return res.status(200).json(messages);
    } catch (error) {
        console.error("getGroupMessages error", error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
}

export const uploadMessageFile = async (req, res) => {
    try {
        const sender = req.user._id;
        let { receiver } = req.body;
        if (!Array.isArray(receiver)) receiver = [receiver];

        if (!req.file?.path) return res.status(400).json({ msg: "File is required" });
        const fileUrl = await fileUpload(req.file.path);

        const message = await Message.create({
            sender,
            receiver,
            messageType: "file",
            fileUrl,
        });

        // Populate sender info for socket emission
        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "firstName lastName email image color");

        // Emit socket event to receiver(s) for real-time display
        const io = getIo();
        if (io) {
            const receiverId = receiver[0];
            
            // Check if it's a group message
            const group = await Group.findById(receiverId);
            
            if (group) {
                // Group file message - emit to all group members
                for (const memberId of group.members) {
                    const memberIdStr = memberId.toString();
                    if (memberIdStr !== sender.toString()) {
                        const memberSocketId = userSocketMap.get(memberIdStr);
                        if (memberSocketId) {
                            console.log('Emitting file message to group member:', memberIdStr);
                            io.to(memberSocketId).emit("receiveMessages", populatedMessage);
                        }
                    }
                }
            } else {
                // Individual file message - emit to receiver
                const receiverSocketId = userSocketMap.get(receiverId);
                if (receiverSocketId) {
                    console.log('Emitting file message to receiver:', receiverId);
                    io.to(receiverSocketId).emit("receiveMessages", populatedMessage);
                }
            }
        }

        res.status(201).json({ message: populatedMessage });
    } catch (error) {
        console.error("uploadMessageFile error", error);
        res.status(500).json({ msg: "Failed to upload file" });
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.body;
        const userId = req.user._id;

        if (!messageId) {
            return res.status(400).json({ msg: "Message ID is required" });
        }

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ msg: "Message not found" });
        }

        // Only the sender can delete their own message
        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ msg: "You can only delete your own messages" });
        }

        await Message.findByIdAndDelete(messageId);
        
        res.status(200).json({ msg: "Message deleted successfully", messageId });
    } catch (error) {
        console.error("deleteMessage error", error);
        res.status(500).json({ msg: "Failed to delete message" });
    }
}