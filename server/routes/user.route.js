import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    loginUser, 
    createUser,
    getUserList,
    getUserById,
    updateUser,
    deleteUser,
    checkAccess,
    updateSameData,
    updateDifferentData
} from "../controllers/user.controller.js";


const router = Router()

router.route("/login").post(loginUser)
router.route("/signup").post(createUser)

// user

router.route("/create").post(createUser)
router.route("/get-all-users").get(getUserList)
router.route("/:id").get(getUserById)
router.route("/:id/update").put(updateUser)
router.route("/:id").delete(deleteUser)

router.route("/:id/check-access").post(checkAccess)

router.route("/update-same").put(updateSameData)
router.route("/update-different").put(updateDifferentData)


export default router