import { Router } from "express"
import { userController } from "../controllers/user.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"
import { validate } from "../middleware/validate.middleware.js"
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../types/user.types.js"

const router = Router()

router.post("/signup", validate(signupSchema), userController.signup)
router.post("/login", validate(loginSchema), userController.login)
router.post("/refresh", userController.refresh)
router.get("/me", authenticate, userController.me)
router.post("/oauth", userController.oauthSignin)
router.post("/forgot-password", validate(forgotPasswordSchema), userController.forgotPassword)
router.post("/reset-password", validate(resetPasswordSchema), userController.resetPassword)

export { router as userRouter }
