import { Request, Response } from "express";
import { search } from "../services/search.service.js";
import { respondWithError } from "../middlewares/error.middleware.js";
import { REGION_GROUP_NAMES, isRegionGroup } from "../utils/regionGroup.js";

/** 쿼리 파라미터를 정수로 파싱하고 범위를 검증한다. 실패 시 에러 메시지를 반환. */
function parsePaging(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  label: string
): { value: number } | { error: string } {
  if (value === undefined) return { value: fallback };
  const n = parseInt(value as string, 10);
  if (isNaN(n) || n < min || n > max) {
    return { error: `${label}은 ${min}~${max} 사이의 숫자여야 합니다.` };
  }
  return { value: n };
}

/**
 * GET /api/search?q=포항&limit=20&offset=0&regionLimit=20&regionOffset=0&regionGroup=충청
 * 지역 이름 + 관광지 이름·주소 통합 검색 (인증 불필요, 시·군 단위만)
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
        res.status(400).json({ success: false, message: p.error });
        return;
      }
    }

    // 권역 칩 필터 (전지역 / 미지정이면 필터 없음)
    const rawGroup = (req.query.regionGroup as string | undefined)?.trim();
    const regionGroup = rawGroup && rawGroup !== "전지역" ? rawGroup : undefined;
    if (regionGroup && !isRegionGroup(regionGroup)) {
      res.status(400).json({
        success: false,
        message: `regionGroup은 다음 중 하나여야 합니다: ${REGION_GROUP_NAMES.join(", ")}`,
      });
      return;
    }

    const result = await search(
      q,
      (limit as { value: number }).value,
      (offset as { value: number }).value,
      (regionLimit as { value: number }).value,
      (regionOffset as { value: number }).value,
      regionGroup
    );
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "통합 검색");
  }
}
