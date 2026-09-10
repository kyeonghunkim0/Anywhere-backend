import axios from "axios";
import { prisma } from "../utils/prisma.js";
import { env } from "../config/env.js";
import { isRetryable, delay } from "../utils/tourApi.js";

// ============================================
// 지역 대표 사진 수집 (한국관광공사 관광사진갤러리)
// PhotoGalleryService1 / gallerySearchList1
// ============================================

const PHOTO_API_BASE = "https://apis.data.go.kr/B551011/PhotoGalleryService1";

const MAX_RETRY = 3;
const RETRY_BASE_DELAY_MS = 500;
/** TourAPI 호출 간격 (rate limit 방지) */
const CALL_INTERVAL_MS = 200;
/** 한 번의 키워드 검색에서 받아올 후보 사진 수 */
const CANDIDATE_ROWS = 20;
/** 링크가 살아있는지 확인해볼 후보 수 (한 검색 단계당) */
const MAX_LIVENESS_CHECKS = 5;

interface GalleryItem {
  galContentId: string;
  galTitle: string;
  galWebImageUrl: string;
  galPhotographyLocation?: string;
  galPhotographer?: string;
  galModifiedtime?: string;
  galSearchKeyword?: string;
}

/**
 * 시·도 정식명과 관광사진갤러리에서 쓰이는 축약 표기를 함께 돌려줍니다.
 * (촬영장소가 "경북", 검색 키워드가 "경상북도 포항시" 처럼 표기가 일정하지 않습니다)
 */
const SIDO_ALIASES: Record<string, string[]> = {
  서울특별시: ["서울특별시", "서울"],
  인천광역시: ["인천광역시", "인천"],
  대전광역시: ["대전광역시", "대전"],
  대구광역시: ["대구광역시", "대구"],
  광주광역시: ["광주광역시", "광주"],
  부산광역시: ["부산광역시", "부산"],
  울산광역시: ["울산광역시", "울산"],
  세종특별자치시: ["세종특별자치시", "세종"],
  경기도: ["경기도", "경기"],
  강원특별자치도: ["강원특별자치도", "강원도", "강원"],
  충청북도: ["충청북도", "충북"],
  충청남도: ["충청남도", "충남"],
  경상북도: ["경상북도", "경북"],
  경상남도: ["경상남도", "경남"],
  전북특별자치도: ["전북특별자치도", "전라북도", "전북"],
  전라남도: ["전라남도", "전남"],
  제주특별자치도: ["제주특별자치도", "제주도", "제주"],
};

function sidoAliases(sidoName: string): string[] {
  return SIDO_ALIASES[sidoName] ?? [sidoName];
}

/**
 * 시·군·구명에서 "시/군/구" 접미사를 뗀 짧은 표기를 돌려줍니다.
 * (갤러리 촬영장소가 "세종특별자치시 전의면" 처럼 표기돼 "세종시"로는 안 잡히는 경우 대비)
 * "중구", "남구" 처럼 두 글자인 이름은 너무 흔해서 줄이지 않습니다.
 */
function shortSigungu(sigunguName: string): string | null {
  if (sigunguName.length < 3) return null;
  if (!/[시군구]$/.test(sigunguName)) return null;
  return sigunguName.slice(0, -1);
}

/**
 * 지명이 "단어 경계"에서 등장하는지 확인합니다.
 * 단순 includes를 쓰면 "양주시"가 "남양주시"에 걸리는 오매칭이 생깁니다.
 */
function includesPlaceName(haystack: string, name: string): boolean {
  let from = 0;
  for (;;) {
    const index = haystack.indexOf(name, from);
    if (index === -1) return false;
    const prev = index > 0 ? haystack[index - 1]! : "";
    if (!/[가-힣]/.test(prev)) return true;
    from = index + 1;
  }
}

/**
 * iOS App Transport Security가 평문 http 이미지를 차단하므로 https로 바꿔 저장합니다.
 * (tong.visitkorea.or.kr 은 https를 지원합니다)
 */
function toHttps(url: string): string {
  return url.replace(/^http:\/\//i, "https://");
}

/**
 * 관광사진갤러리 키워드 검색
 *
 * 일시적인 실패(네트워크 · 429 · 5xx)는 지수 백오프로 재시도하고, 그래도 실패하면
 * 예외를 던져 호출자가 실패 지역으로 집계하게 합니다.
 */
async function searchGallery(keyword: string): Promise<GalleryItem[]> {
  // serviceKey는 이미 URL 인코딩된 값이므로 params가 아니라 URL에 직접 붙입니다.
  // (params로 넘기면 %2F 등이 다시 인코딩되어 인증에 실패합니다)
  const url = `${PHOTO_API_BASE}/gallerySearchList1?serviceKey=${env.PHOTO_API_KEY}`;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 10_000,
        params: {
          numOfRows: CANDIDATE_ROWS,
          pageNo: 1,
          MobileOS: "ETC",
          MobileApp: "Anywhere",
          _type: "json",
          arrange: "C", // 수정일순 (최신 사진 우선)
          keyword,
        },
      });

      // 인증 실패 등은 JSON이 아니라 XML로 내려옵니다.
      if (typeof response.data === "string") {
        throw new Error(
          `관광사진갤러리 응답을 해석할 수 없습니다. 활용신청 승인 여부와 PHOTO_API_KEY를 확인해주세요. (keyword: ${keyword})`
        );
      }

      const body = response.data?.response?.body;
      const resultCode = response.data?.response?.header?.resultCode;

      if (resultCode !== undefined && resultCode !== "0000") {
        throw new Error(
          `관광사진갤러리 오류 응답 (resultCode: ${resultCode}, keyword: ${keyword})`
        );
      }

      const items = body?.items?.item;
      if (!items) return []; // 결과 0건이면 items가 빈 문자열로 옵니다
      return Array.isArray(items) ? items : [items];
    } catch (error) {
      if (attempt === MAX_RETRY || !isRetryable(error)) throw error;

      const wait = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `⚠️ 관광사진갤러리 호출 실패 (keyword: ${keyword}) — ${wait}ms 후 재시도 (${attempt}/${MAX_RETRY - 1})`
      );
      await delay(wait);
    }
  }

  // 위 루프에서 항상 반환하거나 던지므로 도달하지 않습니다 (타입 만족용).
  throw new Error(`관광사진갤러리 호출에 실패했습니다. (keyword: ${keyword})`);
}

/**
 * 후보 사진이 이 지역 사진이 맞는지 점수를 매깁니다. 0이면 관련 없는 사진입니다.
 * 촬영장소 > 검색키워드 > 시·도만 일치 순으로 가중치를 둡니다.
 */
function scoreItem(
  item: GalleryItem,
  sidoName: string,
  sigunguName: string,
  requireSido: boolean
): number {
  const location = item.galPhotographyLocation ?? "";
  const keywords = item.galSearchKeyword ?? "";
  const title = item.galTitle ?? "";
  const aliases = sidoAliases(sidoName);
  const haystack = `${location} ${keywords} ${title}`;

  // 시·도 일치 여부 (촬영장소에 있으면 더 신뢰)
  let sidoScore = 0;
  if (aliases.some((alias) => location.includes(alias))) sidoScore = 20;
  else if (aliases.some((alias) => keywords.includes(alias))) sidoScore = 10;

  // 시·군·구만으로 검색한 결과는 "중구"처럼 여러 시·도에 겹치는 지명이 섞여 들어오므로
  // 시·도가 확인되지 않으면 버립니다.
  if (requireSido && sidoScore === 0) return 0;

  // 1) 시·군·구 정식 명칭이 걸리는 경우 ("포항시")
  if (includesPlaceName(location, sigunguName)) return 100 + sidoScore;
  if (includesPlaceName(keywords, sigunguName) || includesPlaceName(title, sigunguName)) {
    return 50 + sidoScore;
  }

  // 2) 접미사를 뗀 짧은 표기("세종")는 다른 지역과 헷갈릴 수 있으므로
  //    시·도까지 함께 맞을 때만 인정합니다.
  const short = shortSigungu(sigunguName);
  if (short && sidoScore > 0 && includesPlaceName(haystack, short)) {
    return 40 + sidoScore;
  }

  // 시·군·구는 안 맞고 시·도만 걸린 경우는 대표 사진으로 쓰지 않습니다.
  return 0;
}

/** 관련 있는 사진만 남겨 점수 높은 순으로 정렬합니다. 점수가 같으면 최근 수정된 사진이 먼저입니다. */
function rankCandidates(
  items: GalleryItem[],
  sidoName: string,
  sigunguName: string,
  requireSido: boolean
): GalleryItem[] {
  const scored = items
    .filter((item) => Boolean(item.galWebImageUrl))
    .map((item) => ({ item, score: scoreItem(item, sidoName, sigunguName, requireSido) }))
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.item.galModifiedtime ?? "").localeCompare(a.item.galModifiedtime ?? "");
  });

  return scored.map((entry) => entry.item);
}

/**
 * 이미지 URL이 실제로 살아있는지 확인합니다.
 * 갤러리가 이미 폐기된 경로를 돌려주는 경우가 있어(404), 앱에서 깨진 이미지가 뜨는 걸 막습니다.
 */
async function isImageAlive(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      timeout: 10_000,
      responseType: "arraybuffer",
      headers: { Range: "bytes=0-512" },
      validateStatus: () => true,
    });

    const ok = response.status === 200 || response.status === 206;
    const contentType = String(response.headers["content-type"] ?? "");
    return ok && contentType.startsWith("image");
  } catch {
    return false;
  }
}

/** 후보를 점수 순으로 훑으며 실제로 살아있는 첫 사진을 고릅니다. */
async function firstAlive(candidates: GalleryItem[]): Promise<GalleryItem | null> {
  for (const candidate of candidates.slice(0, MAX_LIVENESS_CHECKS)) {
    if (await isImageAlive(toHttps(candidate.galWebImageUrl))) return candidate;
  }
  return null;
}

interface ResolvedPhoto {
  imageUrl: string;
  imageCredit: string | null;
  imageSource: "gallery" | "place";
}

/**
 * 지역 하나의 대표 사진을 결정합니다.
 * 1) "{시도} {시군구}" 검색 → 2) "{시군구}" 단독 검색 → 3) 접미사 뗀 짧은 표기 검색
 * → 4) places.thumbnail 폴백
 */
async function resolveRegionPhoto(region: {
  id: string;
  sidoName: string;
  sigunguName: string;
}): Promise<ResolvedPhoto | null> {
  const { id, sidoName, sigunguName } = region;

  // 1차: 시·도 + 시·군·구 전체 지명
  let items = await searchGallery(`${sidoName} ${sigunguName}`);
  let best = await firstAlive(rankCandidates(items, sidoName, sigunguName, false));

  // 2차: 시·군·구 단독 ("중구", "남구" 처럼 중복 지명은 scoreItem이 걸러냅니다)
  if (!best) {
    await delay(CALL_INTERVAL_MS);
    items = await searchGallery(sigunguName);
    best = await firstAlive(rankCandidates(items, sidoName, sigunguName, true));
  }

  // 3차: 접미사를 뗀 짧은 표기 ("세종시" → "세종")
  const short = shortSigungu(sigunguName);
  if (!best && short) {
    await delay(CALL_INTERVAL_MS);
    items = await searchGallery(`${sidoName} ${short}`);
    best = await firstAlive(rankCandidates(items, sidoName, sigunguName, true));
  }

  if (best) {
    return {
      imageUrl: toHttps(best.galWebImageUrl),
      imageCredit: best.galPhotographer ?? null,
      imageSource: "gallery",
    };
  }

  // 4차: 이미 동기화된 관광지 썸네일로 폴백 (도장·리뷰가 많은 곳 우선)
  const places = await prisma.place.findMany({
    where: { regionId: id, thumbnail: { not: null } },
    orderBy: [{ stamps: { _count: "desc" } }, { reviews: { _count: "desc" } }],
    select: { thumbnail: true },
    take: MAX_LIVENESS_CHECKS,
  });

  for (const place of places) {
    const url = toHttps(place.thumbnail!);
    if (await isImageAlive(url)) {
      return { imageUrl: url, imageCredit: null, imageSource: "place" };
    }
  }

  return null;
}

export interface RegionPhotoSyncResult {
  /** 사진 수집을 시도한 지역 수 */
  totalRegions: number;
  /** 관광사진갤러리로 채운 지역 수 */
  fromGallery: number;
  /** 관광지 썸네일 폴백으로 채운 지역 수 */
  fromPlace: number;
  /** 끝내 사진을 못 채운 지역 이름 목록 */
  failedRegions: string[];
  /** 소요 시간(초) */
  elapsedSec: number;
}

const EMPTY_RESULT: RegionPhotoSyncResult = {
  totalRegions: 0,
  fromGallery: 0,
  fromPlace: 0,
  failedRegions: [],
  elapsedSec: 0,
};

/** 이전 실행이 끝나기 전에 다시 실행되는 것을 막습니다. */
let isSyncing = false;

/**
 * 전체 지역의 대표 사진을 관광사진갤러리에서 수집해 DB에 저장합니다.
 *
 * 기본은 아직 사진이 없는 지역만 처리합니다 (개발계정 일 1,000건 쿼터 절약 + 재실행 안전).
 * force가 true면 이미 채워진 지역까지 다시 수집합니다.
 */
export async function syncRegionPhotos(options?: {
  force?: boolean;
}): Promise<RegionPhotoSyncResult> {
  if (isSyncing) {
    console.warn("⚠️ 이전 지역 사진 수집이 아직 진행 중이라 이번 실행은 건너뜁니다.");
    return EMPTY_RESULT;
  }

  isSyncing = true;
  const force = options?.force ?? false;
  console.log(`🔄 지역 대표 사진 수집 시작... (${force ? "전체 재수집" : "미수집 지역만"})`);
  const startTime = Date.now();

  try {
    const regions = await prisma.region.findMany({
      where: force ? undefined : { imageUrl: null },
      select: { id: true, sidoName: true, sigunguName: true },
    });

    if (regions.length === 0) {
      console.log("ℹ️ 사진을 채울 지역이 없습니다.");
      return EMPTY_RESULT;
    }

    let fromGallery = 0;
    let fromPlace = 0;
    const failedRegions: string[] = [];

    for (const region of regions) {
      const regionLabel = `${region.sidoName} ${region.sigunguName}`;

      try {
        const photo = await resolveRegionPhoto(region);

        if (!photo) {
          failedRegions.push(regionLabel);
          console.warn(`⚠️ ${regionLabel} — 쓸 만한 사진을 찾지 못했습니다.`);

          // 재수집에서 기준이 엄격해져 탈락한 경우, 예전에 잘못 매칭된 사진이
          // 그대로 남지 않도록 비웁니다.
          if (force) {
            await prisma.region.update({
              where: { id: region.id },
              data: {
                imageUrl: null,
                imageCredit: null,
                imageSource: null,
                imageUpdatedAt: null,
              },
            });
          }
        } else {
          await prisma.region.update({
            where: { id: region.id },
            data: {
              imageUrl: photo.imageUrl,
              imageCredit: photo.imageCredit,
              imageSource: photo.imageSource,
              imageUpdatedAt: new Date(),
            },
          });

          if (photo.imageSource === "gallery") fromGallery++;
          else fromPlace++;
        }
      } catch (error) {
        failedRegions.push(regionLabel);
        console.error(`❌ ${regionLabel} 사진 수집 실패:`, error);
      }

      await delay(CALL_INTERVAL_MS);
    }

    const elapsedSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
    console.log(
      `✅ 지역 사진 수집 완료: ${regions.length}개 지역 중 갤러리 ${fromGallery}건, 관광지 썸네일 ${fromPlace}건, 실패 ${failedRegions.length}건 (${elapsedSec}초 소요)`
    );

    return {
      totalRegions: regions.length,
      fromGallery,
      fromPlace,
      failedRegions,
      elapsedSec,
    };
  } finally {
    isSyncing = false;
  }
}
