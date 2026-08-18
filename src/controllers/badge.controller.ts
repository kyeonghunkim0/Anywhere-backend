import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getUserBadges, getActiveSeasonalBadges } from "../services/badge.service.js";
import { respondWithError } from "../middlewares/error.middleware.js";

/**
 * GET /api/badges/me
 */
export async function getMyBadgesController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const badges = await getUserBadges(userId);
    res.json({ success: true, data: badges });
  } catch (error) {
    respondWithError(res, error, "뱃지 조회");
  }
}

/**
 * GET /api/badges/seasonal
 */
export async function getSeasonalBadgesController(_req: Request, res: Response): Promise<void> {
  try {
    const badges = await getActiveSeasonalBadges();
    res.json({ success: true, data: badges });
  } catch (error) {
    respondWithError(res, error, "시즌 뱃지 조회");
  }
}
