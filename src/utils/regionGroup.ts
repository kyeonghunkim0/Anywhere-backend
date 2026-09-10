// ===================================
// 권역(圈域) 필터
// ===================================

import type { Prisma } from "../generated/prisma/client.js";

/**
 * 검색 화면의 권역 칩(전지역 · 충청 · 경상 · 전라 · 강원 …)에 대응하는
 * 권역명 → 시·도명 목록 매핑.
 *
 * "전지역"은 필터를 걸지 않는다는 뜻이라 여기에 넣지 않는다.
 */
export const REGION_GROUPS: Record<string, string[]> = {
  수도권: ["서울특별시", "인천광역시", "경기도"],
  강원: ["강원특별자치도"],
  충청: ["대전광역시", "세종특별자치시", "충청북도", "충청남도"],
  전라: ["광주광역시", "전북특별자치도", "전라남도"],
  경상: ["부산광역시", "대구광역시", "울산광역시", "경상북도", "경상남도"],
  제주: ["제주특별자치도"],
};

/** 허용되는 권역명 목록 (검증·스웨거용) */
export const REGION_GROUP_NAMES = Object.keys(REGION_GROUPS);

/** 유효한 권역명인지 확인한다. */
export function isRegionGroup(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(REGION_GROUPS, value);
}

/**
 * 권역명을 Region where 조건으로 바꾼다.
 * - 권역명이 없거나 "전지역"이면 빈 조건(`{}`)을 반환한다.
 * - 관계로 걸 때: `where: { region: { ...CITY_COUNTY_ONLY, ...regionGroupWhere(g) } }`
 */
export function regionGroupWhere(group?: string): Prisma.RegionWhereInput {
  if (!group || group === "전지역" || !isRegionGroup(group)) return {};
  return { sidoName: { in: REGION_GROUPS[group] } };
}
