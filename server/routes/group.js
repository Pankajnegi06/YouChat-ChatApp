import express from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createGroup, listGroups, addMember, removeMember } from "../controllers/GroupController.js";

const groupRouter = express.Router();

groupRouter.post("/create", verifyjwt, createGroup);
groupRouter.get("/list", verifyjwt, listGroups);
groupRouter.post("/add-member", verifyjwt, addMember);
groupRouter.post("/remove-member", verifyjwt, removeMember);

export default groupRouter;


