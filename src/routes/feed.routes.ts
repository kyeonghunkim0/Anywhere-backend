import { Router } from "express";
import { getRecentFeedController } from "../controllers/feed.controller.js";

const router = Router();

/**
 * GET /api/feed/recent
 * 최근 체크인 활동 피드 (인증 불필요)
 */
router.get("/recent", getRecentFeedController);

export default router;
