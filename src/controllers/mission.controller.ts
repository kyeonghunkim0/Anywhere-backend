import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { checkIn } from "../services/mission.service.js";
import { respondWithError, respondFail, localize } from "../middlewares/error.middleware.js";

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
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const { placeId, lat, lng } = req.body;

    if (!placeId || lat === undefined || lng === undefined) {
      respondFail(res, 400, "mission.paramsRequired");
      return;
    }

    const { messageKey, messageParams, ...result } = await checkIn({
      userId,
      placeId,
      userLat: parseFloat(lat),
      userLng: parseFloat(lng),
    });

    res.status(result.success ? 200 : 400).json({
      ...result,
      message: localize(res, messageKey, messageParams),
    });
  } catch (error) {
    respondWithError(res, error, "체크인");
  }
}
