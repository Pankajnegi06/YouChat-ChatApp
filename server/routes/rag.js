import { searchRag } from "../utils/RagSearch.js";

const ragRouter = express.Router();

ragRouter.post("/ask",searchRag);

export default ragRouter;