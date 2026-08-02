import { Router } from "express";
import { getMyBadgesController, getSeasonalBadgesController } from "../controllers/badge.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/badges/me
 * 내 스페셜(시즌 한정) & 로컬 히든 뱃지 전체 현황
 */
router.get("/me", authMiddleware, getMyBadgesController);

/**
 * GET /api/badges/seasonal
 * 홈 화면 [스페셜 퀘스트] 캐러셀 - 진행 중인 시즌 한정 뱃지
 */
router.get("/seasonal", getSeasonalBadgesController);

export default router;
