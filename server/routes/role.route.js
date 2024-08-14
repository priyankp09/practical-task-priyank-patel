import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createRole,getRoleList, getRoleById, updateRole, deleteRole,updateAccessModule} from "../controllers/role.controller.js";


const router = Router()

router.route("/roles").post(createRole)
router.route("/get-all-roles").get(getRoleList)
router.route("/:id").get(getRoleById)
router.route("/:id").put(updateRole)
router.route("/:id").delete(deleteRole)
router.route("access-module/:id").put(updateAccessModule)



export default router