import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getHomeData } from "../services/home.service.js";
import { respondWithError, respondFail } from "../middlewares/error.middleware.js";

/**
 * GET /api/home
 * 홈 화면 진입용 통합 조회 (currentTrip + seasonalBadges + growthRegions + sectionVisibility)
 */
export async function getHomeController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const result = await getHomeData(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "홈 데이터 조회");
  }
}
