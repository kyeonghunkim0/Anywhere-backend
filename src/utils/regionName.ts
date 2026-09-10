// ===================================
// 지역 표시 이름 유틸
// ===================================

/**
 * 시·도 축약 표기
 * "중구"·"동구"처럼 여러 광역시에 같은 이름이 존재하는 기초자치단체를 구분하기 위해
 * 화면에 붙일 짧은 접두사를 만든다. ("부산광역시" → "부산")
 */
const SIDO_SHORT_NAMES: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

/**
 * 시·도 이름을 화면용 짧은 표기로 변환한다. 매핑에 없으면 원본을 그대로 돌려준다.
 */
export function shortSidoName(sidoName: string): string {
  return SIDO_SHORT_NAMES[sidoName] ?? sidoName;
}

/**
 * 지역 표시 이름을 만든다. (예: "부산 중구", "경기 부천시", "강원 고성군")
 * 세종특별자치시처럼 시·도와 기초자치단체가 같은 경우에는 한 번만 표기한다.
 */
export function formatRegionName(sidoName: string, sigunguName: string): string {
  const short = shortSidoName(sidoName);
  // 세종특별자치시 - 세종시처럼 시·도와 기초자치단체가 겹치면 한 번만 표기한다.
  if (!sigunguName || sigunguName.startsWith(short)) {
    return sigunguName || short;
  }
  return `${short} ${sigunguName}`;
}
