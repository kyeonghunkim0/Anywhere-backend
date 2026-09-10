/**
 * 로컬 성장 게이지 & 방랑자 레벨 계산 유틸
 * - 지역(Region): 누적 체크인 수에 따라 레벨업
 * - 유저(User): 누적 도장 수에 따라 방랑자 등급 부여
 */

export interface RegionLevelDef {
  level: number;
  requiredVisits: number;
  label: string;
  icon: string;
  reward: string;
}

export const REGION_LEVELS: RegionLevelDef[] = [
  { level: 1, requiredVisits: 0, label: "Lv.1 잠든 골목", icon: "moon", reward: "-" },
  { level: 2, requiredVisits: 10, label: "Lv.2 기지개", icon: "sunrise", reward: "히든 뱃지 오픈" },
  { level: 3, requiredVisits: 30, label: "Lv.3 골목 상권", icon: "shop", reward: "지역 스페셜 퀘스트" },
  { level: 4, requiredVisits: 60, label: "Lv.4 로컬 명소", icon: "star", reward: "한정판 뱃지" },
  { level: 5, requiredVisits: 100, label: "Lv.5 핫플레이스", icon: "flame", reward: "지역 홍보 뱃지" },
];

/**
 * 누적 방문 수 기준 지역 레벨 계산
 */
export function getRegionLevel(visitCount: number): number {
  let level = REGION_LEVELS[0].level;
  for (const def of REGION_LEVELS) {
    if (visitCount >= def.requiredVisits) level = def.level;
  }
  return level;
}

/**
 * 다음 레벨까지 필요한 방문 수 (마지막 레벨 달성 시 null)
 */
export function getNextRegionLevelTarget(
  visitCount: number
): { current: number; target: number; nextLevel: number; remaining: number } | null {
  const next = REGION_LEVELS.find((d) => d.requiredVisits > visitCount);
  if (!next) return null;
  return {
    current: visitCount,
    target: next.requiredVisits,
    nextLevel: next.level,
    remaining: next.requiredVisits - visitCount,
  };
}

export interface UserLevelDef {
  level: number;
  requiredStamps: number;
  label: string;
}

export const USER_LEVELS: UserLevelDef[] = [
  { level: 1, requiredStamps: 0, label: "새내기 방랑자" },
  { level: 2, requiredStamps: 5, label: "골목 탐험가" },
  { level: 3, requiredStamps: 15, label: "로컬 헌터" },
  { level: 4, requiredStamps: 30, label: "골목 개척자" },
  { level: 5, requiredStamps: 60, label: "전국 방랑자" },
  { level: 6, requiredStamps: 100, label: "아무데나 마스터" },
];

/**
 * 누적 도장 수 기준 유저(방랑자) 레벨 계산
 */
export function getUserLevel(totalStamps: number): UserLevelDef {
  let current = USER_LEVELS[0];
  for (const def of USER_LEVELS) {
    if (totalStamps >= def.requiredStamps) current = def;
  }
  return current;
}
