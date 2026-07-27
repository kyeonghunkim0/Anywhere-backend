import { Request, Response } from "express";
import { getRecentFeed } from "../services/feed.service.js";

/**
 * GET /api/feed/recent?limit=20
 * 최근 체크인 활동 피드 (인증 불필요, 전체 공개)
 */
export async function getRecentFeedController(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (isNaN(limit) || limit < 1 || limit > 50) {
      res.status(400).json({
        success: false,
        message: "limit은 1~50 사이의 숫자여야 합니다.",
      });
      return;
    }

    const result = await getRecentFeed(limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("피드 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}
