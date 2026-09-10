// ===================================
// 지역 수집 대상 필터
// ===================================

import type { Prisma } from "../generated/prisma/client.js";

/**
 * 수집판·매칭에 노출할 지역 조건.
 * 특별·광역시 자치구(isCityCounty=false)는 제외하고 시·군 단위만 대상으로 한다.
 *
 * - Region 직접 조회: `where: CITY_COUNTY_ONLY`
 * - 관계로 거는 경우: `where: { region: CITY_COUNTY_ONLY }`
 */
export const CITY_COUNTY_ONLY: Prisma.RegionWhereInput = { isCityCounty: true };
