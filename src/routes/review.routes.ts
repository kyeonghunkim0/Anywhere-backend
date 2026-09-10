import { Router } from "express";
import { createReviewController, getReviewsByPlaceController } from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * POST /api/reviews
 * 로컬 후기 작성
 */
router.post("/", authMiddleware, createReviewController);

/**
 * GET /api/reviews/places/:placeId
 * 특정 관광지의 후기 목록
 */
router.get("/places/:placeId", getReviewsByPlaceController);

export default router;
