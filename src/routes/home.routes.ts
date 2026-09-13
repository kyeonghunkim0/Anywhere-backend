import { Router } from "express";
import { getHomeController } from "../controllers/home.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/home
 * 홈 화면 진입용 통합 조회 (currentTrip + seasonalBadges + growthRegions + sectionVisibility)
 */
router.get("/", authMiddleware, getHomeController);

export default router;
