import {verifyjwt} from "../middlewares/verifyjwt.js"
import express from "express"
import { getMessagesForContact, uploadMessageFile } from "../controllers/MessageController.js"
import { upload } from "../middlewares/multer.js";

const messageRouter = express.Router()

messageRouter.post("/getMessagesForContact",verifyjwt,getMessagesForContact)
messageRouter.post("/upload", verifyjwt, upload.single("file"), uploadMessageFile)

export default messageRouter