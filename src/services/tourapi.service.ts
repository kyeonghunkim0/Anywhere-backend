import axios from "axios";
import { prisma } from "../utils/prisma.js";
import { env } from "../config/env.js";
import { isRetryable, delay } from "../utils/tourApi.js";

const TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2";

interface TourApiItem {
  contentid: string;
  title: string;
  addr1: string;
  addr2?: string;
  firstimage?: string;
  mapx: string; // 경도
  mapy: string; // 위도
}

const MAX_RETRY = 3;
const RETRY_BASE_DELAY_MS = 500;

/**
 * TourAPI 4.0 지역기반 관광정보 조회
 * GET /areaBasedList2
 *
 * 일시적인 실패(네트워크 · 429 · 5xx)는 지수 백오프로 재시도하고, 그래도 실패하면
 * 예외를 던져 호출자가 실패 지역으로 집계하게 합니다.
 * (예전에는 빈 배열을 반환해서 "데이터 없음"과 "호출 실패"가 구분되지 않았습니다)
 */
async function fetchPlacesByRegion(
  areaCode: string,
  sigunguCode: string
): Promise<TourApiItem[]> {
  const url = `${TOUR_API_BASE}/areaBasedList2?serviceKey=${env.TOUR_API_KEY}`;

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
          contentTypeId: 12, // 12: 관광지
          // 법정동 코드(lDongRegnCd/lDongSignguCd)가 아니라 TourAPI 지역코드를 씁니다.
          // Region.areaCode/sigunguCode가 TourAPI 지역코드 체계이기 때문입니다.
          areaCode,
          sigunguCode,
          arrange: "A",
        },
      });

      const items = response.data?.response?.body?.items?.item;

      if (!items) return [];
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      if (attempt === MAX_RETRY || !isRetryable(error)) throw error;

      const wait = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `⚠️ TourAPI 호출 실패 (area: ${areaCode}, sigungu: ${sigunguCode}) — ${wait}ms 후 재시도 (${attempt}/${MAX_RETRY - 1})`
      );
      await delay(wait);
    }
  }

  // 위 루프에서 항상 반환하거나 던지므로 도달하지 않습니다 (타입 만족용).
  throw new Error(`TourAPI 호출에 실패했습니다. (area: ${areaCode}, sigungu: ${sigunguCode})`);
}

export interface SyncResult {
  /** 저장(upsert)된 관광지 수 */
  totalSynced: number;
  /** 동기화를 시도한 지역 수 */
  totalRegions: number;
  /** 재시도까지 실패한 지역 이름 목록 */
  failedRegions: string[];
  /** 소요 시간(초) */
  elapsedSec: number;
}

const EMPTY_RESULT: SyncResult = {
  totalSynced: 0,
  totalRegions: 0,
  failedRegions: [],
  elapsedSec: 0,
};

/** 이전 실행이 끝나기 전에 다시 실행되는 것을 막습니다. */
let isSyncing = false;

/**
 * 전체 지역의 관광지 데이터를 TourAPI에서 가져와 DB에 동기화 (Upsert)
 * 매일 새벽 배치 작업으로 실행
 *
 * 한 지역이 실패해도 전체를 중단하지 않고, 실패한 지역 목록을 결과로 돌려줍니다.
 */
export async function syncAllPlaces(): Promise<SyncResult> {
  if (isSyncing) {
    console.warn("⚠️ 이전 TourAPI 동기화가 아직 진행 중이라 이번 실행은 건너뜁니다.");
    return EMPTY_RESULT;
  }

  isSyncing = true;
  console.log("🔄 TourAPI 관광지 데이터 동기화 시작...");
  const startTime = Date.now();

  try {
    const regions = await prisma.region.findMany();

    if (regions.length === 0) {
      console.log("⚠️ Region 데이터가 없습니다. 먼저 지역 마스터 데이터를 등록해주세요.");
      return EMPTY_RESULT;
    }

    let totalSynced = 0;
    const failedRegions: string[] = [];

    for (const region of regions) {
      try {
        const items = await fetchPlacesByRegion(region.areaCode, region.sigunguCode);

        for (const item of items) {
          if (!item.mapx || !item.mapy) continue;

          await prisma.place.upsert({
            where: { contentId: item.contentid },
            update: {
              name: item.title,
              address: `${item.addr1 || ""} ${item.addr2 || ""}`.trim(),
              thumbnail: item.firstimage || null,
              mapX: parseFloat(item.mapx),
              mapY: parseFloat(item.mapy),
            },
            create: {
              contentId: item.contentid,
              name: item.title,
              address: `${item.addr1 || ""} ${item.addr2 || ""}`.trim(),
              thumbnail: item.firstimage || null,
              mapX: parseFloat(item.mapx),
              mapY: parseFloat(item.mapy),
              regionId: region.id,
            },
          });

          totalSynced++;
        }

        // TourAPI 호출 간격 (rate limit 방지)
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        failedRegions.push(`${region.sidoName} ${region.sigunguName}`);
        console.error(`❌ ${region.sidoName} ${region.sigunguName} 동기화 실패:`, error);
      }
    }

    const elapsedSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
    console.log(
      `✅ TourAPI 동기화 완료: ${totalSynced}건 처리, ${regions.length}개 지역 중 ${failedRegions.length}개 실패 (${elapsedSec}초 소요)`
    );

    return { totalSynced, totalRegions: regions.length, failedRegions, elapsedSec };
  } finally {
    isSyncing = false;
  }
}
