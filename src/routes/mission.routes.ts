import { Router } from "express";
import { checkInController } from "../controllers/mission.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * POST /api/mission/check-in
 * GPS 기반 방문 인증 (반경 500m 이내)
 */
router.post("/check-in", authMiddleware, checkInController);

export default router;
