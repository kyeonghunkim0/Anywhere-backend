import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getRandomMatch, MatchLimitExceededError } from "../services/match.service.js";

/**
 * GET /api/match/random?lat=37.5&lng=127.0&radiusKm=50
 */
export async function getRandomMatchController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        message: "lat(위도)과 lng(경도)은 필수 쿼리 파라미터입니다.",
      });
      return;
    }

    const result = await getRandomMatch({ userId, userLat: lat, userLng: lng, radiusKm });

    if (!result) {
      res.status(404).json({
        success: false,
        message: "주변에 매칭 가능한 관광지가 없습니다. 반경을 넓혀보세요.",
      });
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof MatchLimitExceededError) {
      res.status(429).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("랜덤 매칭 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}
