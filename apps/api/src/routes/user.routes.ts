import { Router } from "express"
import { userController } from "../controllers/user.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"
import { validate } from "../middleware/validate.middleware.js"
import { signupSchema, loginSchema } from "../types/user.types.js"

const router = Router()

router.post("/signup", validate(signupSchema), userController.signup)
router.post("/login", validate(loginSchema), userController.login)
router.post("/refresh", userController.refresh)
router.get("/me", authenticate, userController.me)
router.post("/oauth", userController.oauthSignin)

export { router as userRouter }
