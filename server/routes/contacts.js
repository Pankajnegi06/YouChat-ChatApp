import { Router } from "express"
import { SearchContacts } from "../controllers/ContactController.js"
import { verifyjwt } from "../middlewares/verifyjwt.js"
import { getContactsDmList } from "../controllers/Authcontroller.js"
const contacts = Router()

contacts.post("/SearchContacts",verifyjwt,SearchContacts)
contacts.get("/getContactDmList",verifyjwt,getContactsDmList)
export {contacts}