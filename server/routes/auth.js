import express from 'express';
import { SignUp, Login, getUserInfo, ProfileSetup, logout, token } from '../controllers/Authcontroller.js';
import { upload } from '../middlewares/multer.js';
import { verifyjwt } from '../middlewares/verifyjwt.js';

const router = express.Router();

router.route("/signup").post(upload.single("image"), SignUp);
router.route("/login").post(Login);
router.get("/getUserInfo", verifyjwt, getUserInfo);
router.post("/ProfileSetup", verifyjwt,upload.single("image"), ProfileSetup);

router.get("/logout", verifyjwt, logout);


export { router }; 