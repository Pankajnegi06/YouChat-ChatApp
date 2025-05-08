import {verifyjwt} from "../middlewares/verifyjwt.js"
import express from "express"
import { getMessagesForContact } from "../controllers/MessageController.js"

const messageRouter = express.Router()

messageRouter.post("/getMessagesForContact",verifyjwt,getMessagesForContact)

export default messageRouter