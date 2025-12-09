import { Message } from "../models/message.model.js";
import { fileUpload } from "../utils/cloudinaryUpload.js";

export const getMessagesForContact = async (req,res)=>{
    try {
        console.log(req.body)
        
        const user1 = req.user._id;
        const user2 = req.body.id;
        console.log(user2)

        if(!user1 || !user2){
            return res.status(400).json("Need all user Id")
        }

        const messages = await Message.find({
            $or: [
              { sender: user1, receiver: user2 },
              { sender: user2, receiver: user1 }
            ]
          }).sort({ createdAt: 1 });
          
        console.log(messages)
        return res.status(200).json(messages)
    } catch (error) {
        return res.status(500).json("Internal Server Error")
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

        res.status(201).json({ message });
    } catch (error) {
        console.error("uploadMessageFile error", error);
        res.status(500).json({ msg: "Failed to upload file" });
    }
}