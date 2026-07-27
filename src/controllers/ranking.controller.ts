import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getUserRanking, getPlaceRanking, getMyRanking } from "../services/ranking.service.js";

/**
 * GET /api/ranking/users
 * 도장 개수 기준 유저 TOP 10
 */
export async function getUserRankingController(_req: Request, res: Response): Promise<void> {
  try {
    const ranking = await getUserRanking();
    res.json({ success: true, data: ranking });
  } catch (error) {
    console.error("유저 랭킹 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
}

/**
 * GET /api/ranking/places
 * 최근 1주일 인기 지역 TOP 10
 */
export async function getPlaceRankingController(_req: Request, res: Response): Promise<void> {
  try {
    const ranking = await getPlaceRanking();
    res.json({ success: true, data: ranking });
  } catch (error) {
    console.error("명소 랭킹 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
}

/**
 * GET /api/ranking/me
 * 내 랭킹 조회 (인증 필요)
 */
export async function getMyRankingController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const result = await getMyRanking(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("내 랭킹 조회 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
}
