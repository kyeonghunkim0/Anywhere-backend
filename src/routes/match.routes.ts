import { Router } from "express";
import { getRandomMatchController } from "../controllers/match.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/match/random
 * 사용자 GPS 기반 랜덤 관광지 매칭 (인구감소지역 70% 가중치)
 */
router.get("/random", authMiddleware, getRandomMatchController);

export default router;
