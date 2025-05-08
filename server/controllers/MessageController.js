import { Message } from "../models/message.model.js";

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