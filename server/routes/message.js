import {verifyjwt} from "../middlewares/verifyjwt.js"
import express from "express"
import { getMessagesForContact, getGroupMessages, uploadMessageFile, deleteMessage } from "../controllers/MessageController.js"
import { upload } from "../middlewares/multer.js";

const messageRouter = express.Router()

messageRouter.post("/getMessagesForContact", verifyjwt, getMessagesForContact)
messageRouter.post("/getGroupMessages", verifyjwt, getGroupMessages)
messageRouter.post("/upload", verifyjwt, upload.single("file"), uploadMessageFile)
messageRouter.post("/delete", verifyjwt, deleteMessage)

export default messageRouter