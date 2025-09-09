import { searchRag } from "../utils/RagSearch.js";
import express from "express"
const ragRouter = express.Router();

ragRouter.post("/ask",searchRag);

export default ragRouter;