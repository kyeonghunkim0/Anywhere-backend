import { Request, Response } from "express";
import { search } from "../services/search.service.js";
import { respondWithError, respondFail } from "../middlewares/error.middleware.js";
import { REGION_GROUP_NAMES, isRegionGroup } from "../utils/regionGroup.js";
import { parseCoords } from "../utils/coords.js";
import type { MessageParams } from "../i18n/index.js";

/** 쿼리 파라미터를 정수로 파싱하고 범위를 검증한다. 실패 시 번역용 파라미터를 반환. */
function parsePaging(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  label: string
): { value: number } | { error: MessageParams } {
  if (value === undefined) return { value: fallback };
  const n = parseInt(value as string, 10);
  if (isNaN(n) || n < min || n > max) {
    return { error: { label, min, max } };
  }
  return { value: n };
}

/**
 * GET /api/search?q=포항&limit=20&offset=0&regionLimit=20&regionOffset=0&regionGroup=충청&lat=&lng=
 * 지역 이름 + 관광지 이름·주소 통합 검색 (인증 불필요, 시·군 단위만)
 * - q 생략/빈 값: 검색 대신 추천 목록(장소 카탈로그)을 places에 담아 반환, regions는 빈 페이지
 * - lat/lng: 함께 넘기면 관광지별 distanceKm를 서버가 계산 (좌표 하나만 오면 400)
 * - limit/offset: 관광지 페이징
 * - regionLimit/regionOffset: 지역 페이징
 * - regionGroup: 권역 칩 필터(수도권·충청·전라·경상·강원·제주). 지역·관광지 양쪽에 적용
 */
export async function searchController(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string | undefined) ?? "";

    const limit = parsePaging(req.query.limit, 20, 1, 50, "limit");
    const offset = parsePaging(req.query.offset, 0, 0, 1_000_000, "offset");
    const regionLimit = parsePaging(req.query.regionLimit, 20, 1, 50, "regionLimit");
    const regionOffset = parsePaging(req.query.regionOffset, 0, 0, 1_000_000, "regionOffset");

    for (const p of [limit, offset, regionLimit, regionOffset]) {
      if ("error" in p) {
        respondFail(res, 400, "validation.pagingRange", p.error);
        return;
      }
    }

    // 권역 칩 필터 (전지역 / 미지정이면 필터 없음)
    const rawGroup = (req.query.regionGroup as string | undefined)?.trim();
    const regionGroup = rawGroup && rawGroup !== "전지역" ? rawGroup : undefined;
    if (regionGroup && !isRegionGroup(regionGroup)) {
      respondFail(res, 400, "search.regionGroupInvalid", {
        options: REGION_GROUP_NAMES.join(", "),
      });
      return;
    }

    // 위치 좌표(lat/lng): 넘기면 관광지별 distanceKm를 서버가 계산
    const coords = parseCoords(req.query.lat, req.query.lng);
    if (coords === null) {
      respondFail(res, 400, "place.coordsInvalid");
      return;
    }

    const result = await search(
      q,
      (limit as { value: number }).value,
      (offset as { value: number }).value,
      (regionLimit as { value: number }).value,
      (regionOffset as { value: number }).value,
      regionGroup,
      coords
    );
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "통합 검색");
  }
}
