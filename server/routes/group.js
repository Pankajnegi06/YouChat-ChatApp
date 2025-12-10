import express from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createGroup, listGroups, addMember, removeMember, deleteGroup, leaveGroup } from "../controllers/GroupController.js";
import { upload } from "../middlewares/multer.js";

const groupRouter = express.Router();

groupRouter.post("/create", verifyjwt, upload.single("image"), createGroup);
groupRouter.get("/list", verifyjwt, listGroups);
groupRouter.post("/add-member", verifyjwt, addMember);
groupRouter.post("/remove-member", verifyjwt, removeMember);
groupRouter.post("/delete", verifyjwt, deleteGroup);
groupRouter.post("/leave", verifyjwt, leaveGroup);

export default groupRouter;
