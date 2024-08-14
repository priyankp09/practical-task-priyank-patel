import { Router } from "express";
import {loginUser, createUser} from "../controllers/user.controller.js";


const router = Router()

router.route("/login").post(loginUser)
router.route("/signup").post(createUser)


export default router