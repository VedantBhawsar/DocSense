import { Router } from "express"
import { userRouter } from "./user.routes.js"
import { documentRouter } from "./document.routes.js"

const router = Router()

router.use("/auth", userRouter)
router.use("/documents", documentRouter)

export { router as apiRouter }
