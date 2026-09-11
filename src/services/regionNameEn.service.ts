import axios from "axios";
import { prisma } from "../utils/prisma.js";
import { env } from "../config/env.js";
import { isRetryable, delay } from "../utils/tourApi.js";

// ============================================
// 지역 영문명 수집 (한국관광공사 TourAPI 영문 서비스)
// EngService2 / areaCode2 — KorService2와 동일한 시·도/시·군·구 코드 체계를
// 영문 명칭으로 돌려준다. 인증키는 TOUR_API_KEY를 그대로 재사용한다.
// ============================================

const ENG_API_BASE = "https://apis.data.go.kr/B551011/EngService2";

const MAX_RETRY = 3;
const RETRY_BASE_DELAY_MS = 500;
/** TourAPI 호출 간격 (rate limit 방지) */
const CALL_INTERVAL_MS = 200;

interface AreaCodeItem {
  code: string;
  name: string;
}

/**
 * areaCode2 호출 (areaCode 생략 시 시·도 목록, 지정 시 해당 시·도의 시·군·구 목록)
 *
 * 일시적인 실패(네트워크 · 429 · 5xx)는 지수 백오프로 재시도하고, 그래도 실패하면
 * 예외를 던져 호출자가 실패로 집계하게 합니다.
 */
async function fetchAreaCodes(areaCode?: string): Promise<AreaCodeItem[]> {
  // serviceKey는 이미 URL 인코딩된 값이므로 params가 아니라 URL에 직접 붙입니다.
  const url = `${ENG_API_BASE}/areaCode2?serviceKey=${env.TOUR_API_KEY}`;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 10_000,
        params: {
          numOfRows: 100,
          pageNo: 1,
          MobileOS: "ETC",
          MobileApp: "Anywhere",
          _type: "json",
          ...(areaCode ? { areaCode } : {}),
        },
      });

      // 인증 실패 등은 JSON이 아니라 XML로 내려옵니다.
      if (typeof response.data === "string") {
        throw new Error(
          `EngService2 응답을 해석할 수 없습니다. 활용신청 승인 여부와 TOUR_API_KEY를 확인해주세요. (areaCode: ${areaCode ?? "전체"})`
        );
      }

      const resultCode = response.data?.response?.header?.resultCode;
      if (resultCode !== undefined && resultCode !== "0000") {
        throw new Error(
          `EngService2 오류 응답 (resultCode: ${resultCode}, areaCode: ${areaCode ?? "전체"})`
        );
      }

      const items = response.data?.response?.body?.items?.item;
      if (!items) return [];
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      if (attempt === MAX_RETRY || !isRetryable(error)) throw error;

      const wait = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `⚠️ EngService2 호출 실패 (areaCode: ${areaCode ?? "전체"}) — ${wait}ms 후 재시도 (${attempt}/${MAX_RETRY - 1})`
      );
      await delay(wait);
    }
  }

  // 위 루프에서 항상 반환하거나 던지므로 도달하지 않습니다 (타입 만족용).
  throw new Error(`EngService2 호출에 실패했습니다. (areaCode: ${areaCode ?? "전체"})`);
}

/**
 * EngService2와 KorService2의 시·군·구 코드가 어긋나는 지역들의 수동 보정 값.
 * (군위군의 대구 편입 등으로 코드 체계가 갈라진 뒤 영문 카탈로그가 갱신되지 않아
 * areaCode2 코드만으로는 매칭이 안 되는 지역들 — EngService2 응답을 직접 대조해 확인함)
 */
const SIGUNGU_EN_OVERRIDES: Record<string, string> = {
  "충청남도|아산시": "Asan-si",
  "전라남도|영광군": "Yeonggwang-gun",
  "전라남도|영암군": "Yeongam-gun",
  "경상북도|군위군": "Gunwi-gun",
  "경상남도|진주시": "Jinju-si",
  "제주특별자치도|제주시": "Jeju-si",
  "제주특별자치도|서귀포시": "Seogwipo-si",
};

export interface RegionNameEnSyncResult {
  /** 채운 지역 수 */
  updated: number;
  /** 대상 시·도 수 */
  totalSido: number;
  /** 시·군·구 목록을 못 가져온 시·도 코드 목록 */
  failedAreaCodes: string[];
  /** 소요 시간(초) */
  elapsedSec: number;
}

/**
 * 228개 지역의 sidoNameEn/sigunguNameEn을 EngService2에서 가져와 채웁니다.
 * areaCode/sigunguCode(TourAPI 코드)로 매칭하므로 한글판 시딩(prisma/seed.ts)과
 * 코드 체계가 완전히 같습니다.
 */
export async function syncRegionNamesEn(): Promise<RegionNameEnSyncResult> {
  console.log("🔄 지역 영문명 수집 시작...");
  const startTime = Date.now();

  const sidoItems = await fetchAreaCodes();
  const failedAreaCodes: string[] = [];
  let updated = 0;

  for (const sido of sidoItems) {
    try {
      await prisma.region.updateMany({
        where: { areaCode: sido.code },
        data: { sidoNameEn: sido.name },
      });

      await delay(CALL_INTERVAL_MS);
      const sigunguItems = await fetchAreaCodes(sido.code);

      for (const sigungu of sigunguItems) {
        const result = await prisma.region.updateMany({
          where: { areaCode: sido.code, sigunguCode: sigungu.code },
          data: { sigunguNameEn: sigungu.name },
        });
        updated += result.count;
      }
    } catch (error) {
      failedAreaCodes.push(sido.code);
      console.error(`❌ 시·도 코드 ${sido.code}(${sido.name}) 영문명 수집 실패:`, error);
    }

    await delay(CALL_INTERVAL_MS);
  }

  // 코드 매칭으로 못 채운 지역은 수동 보정 값으로 채운다.
  for (const [key, sigunguNameEn] of Object.entries(SIGUNGU_EN_OVERRIDES)) {
    const [sidoName, sigunguName] = key.split("|") as [string, string];
    const result = await prisma.region.updateMany({
      where: { sidoName, sigunguName, sigunguNameEn: null },
      data: { sigunguNameEn },
    });
    updated += result.count;
  }

  const elapsedSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
  console.log(
    `✅ 지역 영문명 수집 완료: ${sidoItems.length}개 시·도 중 ${failedAreaCodes.length}개 실패, ${updated}개 지역 갱신 (${elapsedSec}초 소요)`
  );

  return { updated, totalSido: sidoItems.length, failedAreaCodes, elapsedSec };
}
