import { Router } from "express";
import { getPassportController } from "../controllers/passport.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/passport/:userId
 * 해당 사용자의 228개 지역 도장 수집 현황 반환
 */
router.get("/:userId", authMiddleware, getPassportController);

export default router;
