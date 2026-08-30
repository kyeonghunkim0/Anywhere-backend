import { Request, Response } from "express";
import { getPlaceDetail } from "../services/place.service.js";
import { respondWithError } from "../middlewares/error.middleware.js";

/**
 * GET /api/places/:placeId?reviewLimit=20
 * 장소 상세 (이름·주소·좌표·지역·태그·후기)
 */
export async function getPlaceDetailController(req: Request, res: Response): Promise<void> {
  try {
    const placeId = req.params.placeId as string;
    const reviewLimit = req.query.reviewLimit
      ? parseInt(req.query.reviewLimit as string, 10)
      : 20;

    const result = await getPlaceDetail(placeId, reviewLimit);
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "장소 상세 조회");
  }
}
