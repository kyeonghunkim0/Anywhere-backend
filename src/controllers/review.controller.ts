import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import {
  createReview,
  getReviewsByPlace,
  reportReview,
  getReviewReports,
  deleteReview,
} from "../services/review.service.js";
import { respondWithError, respondFail, localize } from "../middlewares/error.middleware.js";

/**
 * POST /api/reviews
 *
 * Request Body:
 * {
 *   "placeId": "관광지 ID",
 *   "content": "후기 내용"
 * }
 */
export async function createReviewController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const { placeId, content } = req.body;
    if (!placeId || !content) {
      respondFail(res, 400, "review.placeIdContentRequired");
      return;
    }

    const result = await createReview({ userId, placeId, content });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "후기 작성");
  }
}

/**
 * GET /api/reviews/places/:placeId?limit=20
 */
export async function getReviewsByPlaceController(req: Request, res: Response): Promise<void> {
  try {
    const placeId = req.params.placeId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await getReviewsByPlace(placeId, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "후기 조회");
  }
}

/**
 * POST /api/reviews/:reviewId/report
 *
 * Request Body:
 * {
 *   "reason": "SPAM" | "ABUSE" | "INAPPROPRIATE" | "ETC",
 *   "detail": "기타 사유 상세 (선택)"
 * }
 */
export async function reportReviewController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const reviewId = req.params.reviewId as string;
    const { reason, detail } = req.body;
    if (!reason) {
      respondFail(res, 400, "review.reasonRequired");
      return;
    }

    const result = await reportReview({ reporterId: userId, reviewId, reason, detail });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "후기 신고");
  }
}

/**
 * GET /api/reviews/reports?limit=50 (관리자)
 */
export async function getReviewReportsController(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await getReviewReports(limit);
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "후기 신고 목록 조회");
  }
}

/**
 * DELETE /api/reviews/:reviewId (관리자)
 * 신고된 후기 삭제
 */
export async function deleteReviewController(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params.reviewId as string;
    await deleteReview(reviewId);
    res.json({ success: true, message: localize(res, "review.deleted") });
  } catch (error) {
    respondWithError(res, error, "후기 삭제");
  }
}
