import { Router } from "express";
import {
  createReviewController,
  getReviewsByPlaceController,
  reportReviewController,
  getReviewReportsController,
  deleteReviewController,
} from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();

/**
 * POST /api/reviews
 * 로컬 후기 작성
 */
router.post("/", authMiddleware, createReviewController);

/**
 * GET /api/reviews/reports (관리자)
 * 신고된 후기 목록 조회
 */
router.get("/reports", adminMiddleware, getReviewReportsController);

/**
 * GET /api/reviews/places/:placeId
 * 특정 관광지의 후기 목록
 */
router.get("/places/:placeId", getReviewsByPlaceController);

/**
 * POST /api/reviews/:reviewId/report
 * 후기 신고
 */
router.post("/:reviewId/report", authMiddleware, reportReviewController);

/**
 * DELETE /api/reviews/:reviewId (관리자)
 * 신고된 후기 삭제
 */
router.delete("/:reviewId", adminMiddleware, deleteReviewController);

export default router;
