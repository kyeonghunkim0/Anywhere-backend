import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { createReview, getReviewsByPlace } from "../services/review.service.js";

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
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const { placeId, content } = req.body;
    if (!placeId || !content) {
      res.status(400).json({
        success: false,
        message: "placeId와 content는 필수입니다.",
      });
      return;
    }

    const result = await createReview({ userId, placeId, content });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "존재하지 않는 관광지입니다.") {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof Error) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    console.error("후기 작성 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
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
    console.error("후기 조회 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
}
