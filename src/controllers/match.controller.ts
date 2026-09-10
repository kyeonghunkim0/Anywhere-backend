import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { respondWithError, respondFail, localize } from "../middlewares/error.middleware.js";
import {
  getRandomMatch,
  confirmMatch,
  cancelMatch,
  getCurrentTrip,
} from "../services/match.service.js";

/**
 * GET /api/match/random?lat=37.5&lng=127.0&radiusKm=50
 */
export async function getRandomMatchController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined;
    const tagId = req.query.tagId as string | undefined;

    if (isNaN(lat) || isNaN(lng)) {
      respondFail(res, 400, "match.latLngRequired");
      return;
    }

    const result = await getRandomMatch({ userId, userLat: lat, userLng: lng, radiusKm, tagId });

    if (!result) {
      respondFail(res, 404, "match.noMatchNearby");
      return;
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    respondWithError(res, error, "랜덤 매칭");
  }
}

/**
 * POST /api/match/:matchId/confirm
 * "여기로 결정" - 매칭 후보를 진행 중인 여정으로 확정
 */
export async function confirmMatchController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const matchId = req.params.matchId as string;
    const trip = await confirmMatch(userId, matchId);

    res.json({ success: true, data: trip });
  } catch (error) {
    respondWithError(res, error, "매칭 확정");
  }
}

/**
 * POST /api/match/:matchId/cancel
 * "여정 취소하기"
 */
export async function cancelMatchController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const matchId = req.params.matchId as string;
    await cancelMatch(userId, matchId);

    res.json({ success: true, message: localize(res, "match.tripCancelled") });
  } catch (error) {
    respondWithError(res, error, "매칭 취소");
  }
}

/**
 * GET /api/match/current
 * 홈 화면 "이동 중" 카드 - 진행 중인 여정 조회 (없으면 data: null)
 */
export async function getCurrentTripController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const trip = await getCurrentTrip(userId);
    res.json({ success: true, data: trip });
  } catch (error) {
    respondWithError(res, error, "진행 중 여정 조회");
  }
}
