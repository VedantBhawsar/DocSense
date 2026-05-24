import { Router } from "express"
import { userRouter } from "./user.routes.js"
import { documentRouter } from "./document.routes.js"
import { chatRouter } from "./chat.routes.js"
import { searchRouter } from "./search.routes.js"
import { subscriptionRouter } from "./subscription.routes.js"

const router = Router()

router.use("/auth", userRouter)
router.use("/users", userRouter)
router.use("/documents", documentRouter)
router.use("/chats", chatRouter)
router.use("/search", searchRouter)
router.use("/subscription", subscriptionRouter)

export { router as apiRouter }
