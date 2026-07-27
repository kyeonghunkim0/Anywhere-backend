import axios from "axios";
import { prisma } from "../utils/prisma.js";
import { env } from "../config/env.js";

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

/**
 * TourAPI 4.0 지역기반 관광정보 조회
 * GET /areaBasedList2
 */
async function fetchPlacesByRegion(
  areaCode: string,
  sigunguCode: string
): Promise<TourApiItem[]> {
  try {
    const url = `${TOUR_API_BASE}/areaBasedList2?serviceKey=${env.TOUR_API_KEY}`;
    const response = await axios.get(url, {
      params: {
        numOfRows: 100,
        pageNo: 1,
        MobileOS: "ETC",
        MobileApp: "Anywhere",
        _type: "json",
        contentTypeId: 12, // 12: 관광지
        lDongRegnCd: areaCode,
        lDongSignguCd: sigunguCode,
        arrange: "A",
      },
    });

    const items = response.data?.response?.body?.items?.item;

    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    console.error(`TourAPI 호출 실패 (area: ${areaCode}, sigungu: ${sigunguCode}):`, error);
    return [];
  }
}

/**
 * 전체 지역의 관광지 데이터를 TourAPI에서 가져와 DB에 동기화 (Upsert)
 * 매일 새벽 배치 작업으로 실행
 */
export async function syncAllPlaces(): Promise<void> {
  console.log("🔄 TourAPI 관광지 데이터 동기화 시작...");
  const startTime = Date.now();

  const regions = await prisma.region.findMany();

  if (regions.length === 0) {
    console.log("⚠️ Region 데이터가 없습니다. 먼저 지역 마스터 데이터를 등록해주세요.");
    return;
  }

  let totalSynced = 0;
  let totalErrors = 0;

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
      totalErrors++;
      console.error(`❌ ${region.sidoName} ${region.sigunguName} 동기화 실패:`, error);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ TourAPI 동기화 완료: ${totalSynced}건 처리, ${totalErrors}건 에러 (${elapsed}초 소요)`);
}
