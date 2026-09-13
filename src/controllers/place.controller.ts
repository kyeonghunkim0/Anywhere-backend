import { Request, Response } from "express";
import { getPlaceDetail, listPlaces } from "../services/place.service.js";
import { respondWithError, respondFail } from "../middlewares/error.middleware.js";
import { REGION_GROUP_NAMES, isRegionGroup } from "../utils/regionGroup.js";
import { parseCoords } from "../utils/coords.js";

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

/**
 * GET /api/places?depopulated=true&regionGroup=충청&limit=20&offset=0&lat=&lng=
 * 검색·발견 대상 장소 카탈로그 (인증 불필요).
 * 검색어가 비었을 때 보여줄 "추천 목록"을 N+1 없이 한 번에 내려준다.
 */
export async function listPlacesController(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const offset = parseInt((req.query.offset as string) ?? "0", 10);
    if (isNaN(limit) || limit < 1 || limit > 50 || isNaN(offset) || offset < 0) {
      respondFail(res, 400, "validation.pagingRange", { label: "limit/offset", min: 1, max: 50 });
      return;
    }

    const rawGroup = (req.query.regionGroup as string | undefined)?.trim();
    const regionGroup = rawGroup && rawGroup !== "전지역" ? rawGroup : undefined;
    if (regionGroup && !isRegionGroup(regionGroup)) {
      respondFail(res, 400, "search.regionGroupInvalid", {
        options: REGION_GROUP_NAMES.join(", "),
      });
      return;
    }

    const coords = parseCoords(req.query.lat, req.query.lng);
    if (coords === null) {
      respondFail(res, 400, "place.coordsInvalid");
      return;
    }

    const result = await listPlaces({
      limit,
      offset,
      regionGroup,
      depopulatedOnly: req.query.depopulated === "true",
      coords,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "장소 목록 조회");
  }
}
