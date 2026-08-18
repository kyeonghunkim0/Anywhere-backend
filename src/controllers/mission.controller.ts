import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { checkIn } from "../services/mission.service.js";
import { respondWithError } from "../middlewares/error.middleware.js";

/**
 * POST /api/mission/check-in
 * 
 * Request Body:
 * {
 *   "placeId": "관광지 ID",
 *   "lat": 37.5,
 *   "lng": 127.0
 * }
 */
export async function checkInController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const { placeId, lat, lng } = req.body;

    if (!placeId || lat === undefined || lng === undefined) {
      res.status(400).json({
        success: false,
        message: "placeId, lat(위도), lng(경도)은 필수입니다.",
      });
      return;
    }

    const result = await checkIn({
      userId,
      placeId,
      userLat: parseFloat(lat),
      userLng: parseFloat(lng),
    });

    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    respondWithError(res, error, "체크인");
  }
}
