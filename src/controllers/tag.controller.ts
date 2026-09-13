import { Request, Response } from "express";
import { getTags, getPlacesByTag, attachPlaceTag, detachPlaceTag } from "../services/tag.service.js";
import { respondWithError, respondFail } from "../middlewares/error.middleware.js";
import { parseCoords } from "../utils/coords.js";

/**
 * GET /api/tags
 */
export async function getTagsController(_req: Request, res: Response): Promise<void> {
  try {
    const tags = await getTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    respondWithError(res, error, "태그 조회");
  }
}

/**
 * GET /api/tags/:tagId/places?lat=&lng=
 * lat/lng를 함께 넘기면 관광지별 distanceKm를 서버가 계산한다 (좌표 하나만 오면 400).
 */
export async function getPlacesByTagController(req: Request, res: Response): Promise<void> {
  try {
    const tagId = req.params.tagId as string;

    const coords = parseCoords(req.query.lat, req.query.lng);
    if (coords === null) {
      respondFail(res, 400, "place.coordsInvalid");
      return;
    }

    const places = await getPlacesByTag(tagId, coords);
    res.json({ success: true, data: places });
  } catch (error) {
    respondWithError(res, error, "태그별 관광지 조회");
  }
}

/**
 * POST /api/tags/:tagId/places (관리자)
 *
 * Request Body:
 * {
 *   "placeId": "필수 — 태그를 붙일 관광지 ID"
 * }
 */
export async function attachPlaceTagController(req: Request, res: Response): Promise<void> {
  try {
    const tagId = req.params.tagId as string;
    const { placeId } = req.body;

    if (!placeId) {
      respondFail(res, 400, "place.idRequired");
      return;
    }

    await attachPlaceTag(tagId, placeId);
    res.status(201).json({ success: true, data: { tagId, placeId } });
  } catch (error) {
    respondWithError(res, error, "태그-관광지 연결");
  }
}

/**
 * DELETE /api/tags/:tagId/places/:placeId (관리자)
 */
export async function detachPlaceTagController(req: Request, res: Response): Promise<void> {
  try {
    const tagId = req.params.tagId as string;
    const placeId = req.params.placeId as string;

    await detachPlaceTag(tagId, placeId);
    res.json({ success: true, data: { tagId, placeId } });
  } catch (error) {
    respondWithError(res, error, "태그-관광지 연결 해제");
  }
}
