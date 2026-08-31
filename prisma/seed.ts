import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * 전국 228개 기초자치단체 마스터 데이터
 *
 * 각 항목:
 * - sidoName: 시·도명
 * - sigunguName: 시·군·구명
 * - areaCode: TourAPI 시·도 코드
 * - sigunguCode: TourAPI 시·군·구 코드
 * - isDepopulated: 인구감소지역 여부 (행정안전부 지정 89개 지역)
 * - centerLat: 중심 위도
 * - centerLng: 중심 경도
 */
interface RegionSeedData {
  sidoName: string;
  sigunguName: string;
  areaCode: string;
  sigunguCode: string;
  isDepopulated: boolean;
  centerLat: number;
  centerLng: number;
  /**
   * 시·군 단위 여부. 생략하면 sigunguName으로 자동 판별한다.
   * (특별·광역시 자치구는 "구"로 끝나므로 false — 수집판·매칭에서 제외된다.)
   * 행정시 등 예외가 생기면 여기서 명시적으로 지정한다.
   */
  isCityCounty?: boolean;
}

/** "구"로 끝나면 자치구, 그 외("시"·"군")는 시·군 단위로 본다. */
function resolveIsCityCounty(region: RegionSeedData): boolean {
  return region.isCityCounty ?? !region.sigunguName.endsWith("구");
}

const regions: RegionSeedData[] = [
  // ============================================
  // 서울특별시 (areaCode: 1) - 25개 구
  // ============================================
  { sidoName: "서울특별시", sigunguName: "강남구", areaCode: "1", sigunguCode: "1", isDepopulated: false, centerLat: 37.5172, centerLng: 127.0473 },
  { sidoName: "서울특별시", sigunguName: "강동구", areaCode: "1", sigunguCode: "2", isDepopulated: false, centerLat: 37.5301, centerLng: 127.1238 },
  { sidoName: "서울특별시", sigunguName: "강북구", areaCode: "1", sigunguCode: "3", isDepopulated: false, centerLat: 37.6396, centerLng: 127.0255 },
  { sidoName: "서울특별시", sigunguName: "강서구", areaCode: "1", sigunguCode: "4", isDepopulated: false, centerLat: 37.5509, centerLng: 126.8495 },
  { sidoName: "서울특별시", sigunguName: "관악구", areaCode: "1", sigunguCode: "5", isDepopulated: false, centerLat: 37.4784, centerLng: 126.9516 },
  { sidoName: "서울특별시", sigunguName: "광진구", areaCode: "1", sigunguCode: "6", isDepopulated: false, centerLat: 37.5385, centerLng: 127.0823 },
  { sidoName: "서울특별시", sigunguName: "구로구", areaCode: "1", sigunguCode: "7", isDepopulated: false, centerLat: 37.4954, centerLng: 126.8874 },
  { sidoName: "서울특별시", sigunguName: "금천구", areaCode: "1", sigunguCode: "8", isDepopulated: false, centerLat: 37.4519, centerLng: 126.8955 },
  { sidoName: "서울특별시", sigunguName: "노원구", areaCode: "1", sigunguCode: "9", isDepopulated: false, centerLat: 37.6542, centerLng: 127.0568 },
  { sidoName: "서울특별시", sigunguName: "도봉구", areaCode: "1", sigunguCode: "10", isDepopulated: false, centerLat: 37.6688, centerLng: 127.0471 },
  { sidoName: "서울특별시", sigunguName: "동대문구", areaCode: "1", sigunguCode: "11", isDepopulated: false, centerLat: 37.5744, centerLng: 127.0400 },
  { sidoName: "서울특별시", sigunguName: "동작구", areaCode: "1", sigunguCode: "12", isDepopulated: false, centerLat: 37.5124, centerLng: 126.9393 },
  { sidoName: "서울특별시", sigunguName: "마포구", areaCode: "1", sigunguCode: "13", isDepopulated: false, centerLat: 37.5663, centerLng: 126.9014 },
  { sidoName: "서울특별시", sigunguName: "서대문구", areaCode: "1", sigunguCode: "14", isDepopulated: false, centerLat: 37.5791, centerLng: 126.9368 },
  { sidoName: "서울특별시", sigunguName: "서초구", areaCode: "1", sigunguCode: "15", isDepopulated: false, centerLat: 37.4837, centerLng: 127.0324 },
  { sidoName: "서울특별시", sigunguName: "성동구", areaCode: "1", sigunguCode: "16", isDepopulated: false, centerLat: 37.5633, centerLng: 127.0371 },
  { sidoName: "서울특별시", sigunguName: "성북구", areaCode: "1", sigunguCode: "17", isDepopulated: false, centerLat: 37.5894, centerLng: 127.0167 },
  { sidoName: "서울특별시", sigunguName: "송파구", areaCode: "1", sigunguCode: "18", isDepopulated: false, centerLat: 37.5145, centerLng: 127.1059 },
  { sidoName: "서울특별시", sigunguName: "양천구", areaCode: "1", sigunguCode: "19", isDepopulated: false, centerLat: 37.5170, centerLng: 126.8665 },
  { sidoName: "서울특별시", sigunguName: "영등포구", areaCode: "1", sigunguCode: "20", isDepopulated: false, centerLat: 37.5264, centerLng: 126.8963 },
  { sidoName: "서울특별시", sigunguName: "용산구", areaCode: "1", sigunguCode: "21", isDepopulated: false, centerLat: 37.5324, centerLng: 126.9907 },
  { sidoName: "서울특별시", sigunguName: "은평구", areaCode: "1", sigunguCode: "22", isDepopulated: false, centerLat: 37.6027, centerLng: 126.9291 },
  { sidoName: "서울특별시", sigunguName: "종로구", areaCode: "1", sigunguCode: "23", isDepopulated: false, centerLat: 37.5735, centerLng: 126.9790 },
  { sidoName: "서울특별시", sigunguName: "중구", areaCode: "1", sigunguCode: "24", isDepopulated: false, centerLat: 37.5636, centerLng: 126.9975 },
  { sidoName: "서울특별시", sigunguName: "중랑구", areaCode: "1", sigunguCode: "25", isDepopulated: false, centerLat: 37.6063, centerLng: 127.0928 },

  // ============================================
  // 인천광역시 (areaCode: 2) - 10개 구·군
  // ============================================
  { sidoName: "인천광역시", sigunguName: "강화군", areaCode: "2", sigunguCode: "1", isDepopulated: true, centerLat: 37.7469, centerLng: 126.4878 },
  { sidoName: "인천광역시", sigunguName: "계양구", areaCode: "2", sigunguCode: "2", isDepopulated: false, centerLat: 37.5372, centerLng: 126.7376 },
  { sidoName: "인천광역시", sigunguName: "미추홀구", areaCode: "2", sigunguCode: "3", isDepopulated: false, centerLat: 37.4639, centerLng: 126.6503 },
  { sidoName: "인천광역시", sigunguName: "남동구", areaCode: "2", sigunguCode: "4", isDepopulated: false, centerLat: 37.4488, centerLng: 126.7310 },
  { sidoName: "인천광역시", sigunguName: "동구", areaCode: "2", sigunguCode: "5", isDepopulated: false, centerLat: 37.4737, centerLng: 126.6432 },
  { sidoName: "인천광역시", sigunguName: "부평구", areaCode: "2", sigunguCode: "6", isDepopulated: false, centerLat: 37.5076, centerLng: 126.7219 },
  { sidoName: "인천광역시", sigunguName: "서구", areaCode: "2", sigunguCode: "7", isDepopulated: false, centerLat: 37.5457, centerLng: 126.6760 },
  { sidoName: "인천광역시", sigunguName: "연수구", areaCode: "2", sigunguCode: "8", isDepopulated: false, centerLat: 37.4101, centerLng: 126.6784 },
  { sidoName: "인천광역시", sigunguName: "옹진군", areaCode: "2", sigunguCode: "9", isDepopulated: true, centerLat: 37.4467, centerLng: 126.6367 },
  { sidoName: "인천광역시", sigunguName: "중구", areaCode: "2", sigunguCode: "10", isDepopulated: false, centerLat: 37.4737, centerLng: 126.6217 },

  // ============================================
  // 대전광역시 (areaCode: 3) - 5개 구
  // ============================================
  { sidoName: "대전광역시", sigunguName: "대덕구", areaCode: "3", sigunguCode: "1", isDepopulated: false, centerLat: 36.3468, centerLng: 127.4156 },
  { sidoName: "대전광역시", sigunguName: "동구", areaCode: "3", sigunguCode: "2", isDepopulated: false, centerLat: 36.3119, centerLng: 127.4548 },
  { sidoName: "대전광역시", sigunguName: "서구", areaCode: "3", sigunguCode: "3", isDepopulated: false, centerLat: 36.3555, centerLng: 127.3836 },
  { sidoName: "대전광역시", sigunguName: "유성구", areaCode: "3", sigunguCode: "4", isDepopulated: false, centerLat: 36.3622, centerLng: 127.3562 },
  { sidoName: "대전광역시", sigunguName: "중구", areaCode: "3", sigunguCode: "5", isDepopulated: false, centerLat: 36.3255, centerLng: 127.4213 },

  // ============================================
  // 대구광역시 (areaCode: 4) - 8개 구·군
  // ============================================
  { sidoName: "대구광역시", sigunguName: "남구", areaCode: "4", sigunguCode: "1", isDepopulated: false, centerLat: 35.8461, centerLng: 128.5975 },
  { sidoName: "대구광역시", sigunguName: "달서구", areaCode: "4", sigunguCode: "2", isDepopulated: false, centerLat: 35.8299, centerLng: 128.5327 },
  { sidoName: "대구광역시", sigunguName: "달성군", areaCode: "4", sigunguCode: "3", isDepopulated: false, centerLat: 35.7745, centerLng: 128.4314 },
  { sidoName: "대구광역시", sigunguName: "동구", areaCode: "4", sigunguCode: "4", isDepopulated: false, centerLat: 35.8863, centerLng: 128.6358 },
  { sidoName: "대구광역시", sigunguName: "북구", areaCode: "4", sigunguCode: "5", isDepopulated: false, centerLat: 35.8858, centerLng: 128.5828 },
  { sidoName: "대구광역시", sigunguName: "서구", areaCode: "4", sigunguCode: "6", isDepopulated: false, centerLat: 35.8718, centerLng: 128.5592 },
  { sidoName: "대구광역시", sigunguName: "수성구", areaCode: "4", sigunguCode: "7", isDepopulated: false, centerLat: 35.8566, centerLng: 128.6308 },
  { sidoName: "대구광역시", sigunguName: "중구", areaCode: "4", sigunguCode: "8", isDepopulated: false, centerLat: 35.8694, centerLng: 128.6059 },

  // ============================================
  // 광주광역시 (areaCode: 5) - 5개 구
  // ============================================
  { sidoName: "광주광역시", sigunguName: "광산구", areaCode: "5", sigunguCode: "1", isDepopulated: false, centerLat: 35.1394, centerLng: 126.7937 },
  { sidoName: "광주광역시", sigunguName: "남구", areaCode: "5", sigunguCode: "2", isDepopulated: false, centerLat: 35.1328, centerLng: 126.9025 },
  { sidoName: "광주광역시", sigunguName: "동구", areaCode: "5", sigunguCode: "3", isDepopulated: false, centerLat: 35.1460, centerLng: 126.9231 },
  { sidoName: "광주광역시", sigunguName: "북구", areaCode: "5", sigunguCode: "4", isDepopulated: false, centerLat: 35.1743, centerLng: 126.9120 },
  { sidoName: "광주광역시", sigunguName: "서구", areaCode: "5", sigunguCode: "5", isDepopulated: false, centerLat: 35.1523, centerLng: 126.8895 },

  // ============================================
  // 부산광역시 (areaCode: 6) - 16개 구·군
  // ============================================
  { sidoName: "부산광역시", sigunguName: "강서구", areaCode: "6", sigunguCode: "1", isDepopulated: false, centerLat: 35.2121, centerLng: 128.9808 },
  { sidoName: "부산광역시", sigunguName: "금정구", areaCode: "6", sigunguCode: "2", isDepopulated: false, centerLat: 35.2432, centerLng: 129.0923 },
  { sidoName: "부산광역시", sigunguName: "기장군", areaCode: "6", sigunguCode: "3", isDepopulated: false, centerLat: 35.2446, centerLng: 129.2222 },
  { sidoName: "부산광역시", sigunguName: "남구", areaCode: "6", sigunguCode: "4", isDepopulated: false, centerLat: 35.1368, centerLng: 129.0849 },
  { sidoName: "부산광역시", sigunguName: "동구", areaCode: "6", sigunguCode: "5", isDepopulated: false, centerLat: 35.1295, centerLng: 129.0451 },
  { sidoName: "부산광역시", sigunguName: "동래구", areaCode: "6", sigunguCode: "6", isDepopulated: false, centerLat: 35.1960, centerLng: 129.0855 },
  { sidoName: "부산광역시", sigunguName: "부산진구", areaCode: "6", sigunguCode: "7", isDepopulated: false, centerLat: 35.1631, centerLng: 129.0532 },
  { sidoName: "부산광역시", sigunguName: "북구", areaCode: "6", sigunguCode: "8", isDepopulated: false, centerLat: 35.1972, centerLng: 129.0295 },
  { sidoName: "부산광역시", sigunguName: "사상구", areaCode: "6", sigunguCode: "9", isDepopulated: false, centerLat: 35.1527, centerLng: 128.9908 },
  { sidoName: "부산광역시", sigunguName: "사하구", areaCode: "6", sigunguCode: "10", isDepopulated: false, centerLat: 35.1046, centerLng: 128.9741 },
  { sidoName: "부산광역시", sigunguName: "서구", areaCode: "6", sigunguCode: "11", isDepopulated: false, centerLat: 35.0979, centerLng: 129.0242 },
  { sidoName: "부산광역시", sigunguName: "수영구", areaCode: "6", sigunguCode: "12", isDepopulated: false, centerLat: 35.1455, centerLng: 129.1134 },
  { sidoName: "부산광역시", sigunguName: "연제구", areaCode: "6", sigunguCode: "13", isDepopulated: false, centerLat: 35.1760, centerLng: 129.0800 },
  { sidoName: "부산광역시", sigunguName: "영도구", areaCode: "6", sigunguCode: "14", isDepopulated: false, centerLat: 35.0912, centerLng: 129.0677 },
  { sidoName: "부산광역시", sigunguName: "중구", areaCode: "6", sigunguCode: "15", isDepopulated: false, centerLat: 35.1065, centerLng: 129.0324 },
  { sidoName: "부산광역시", sigunguName: "해운대구", areaCode: "6", sigunguCode: "16", isDepopulated: false, centerLat: 35.1634, centerLng: 129.1635 },

  // ============================================
  // 울산광역시 (areaCode: 7) - 5개 구·군
  // ============================================
  { sidoName: "울산광역시", sigunguName: "남구", areaCode: "7", sigunguCode: "1", isDepopulated: false, centerLat: 35.5443, centerLng: 129.3300 },
  { sidoName: "울산광역시", sigunguName: "동구", areaCode: "7", sigunguCode: "2", isDepopulated: false, centerLat: 35.5050, centerLng: 129.4166 },
  { sidoName: "울산광역시", sigunguName: "북구", areaCode: "7", sigunguCode: "3", isDepopulated: false, centerLat: 35.5834, centerLng: 129.3614 },
  { sidoName: "울산광역시", sigunguName: "울주군", areaCode: "7", sigunguCode: "4", isDepopulated: false, centerLat: 35.5225, centerLng: 129.2426 },
  { sidoName: "울산광역시", sigunguName: "중구", areaCode: "7", sigunguCode: "5", isDepopulated: false, centerLat: 35.5694, centerLng: 129.3322 },

  // ============================================
  // 세종특별자치시 (areaCode: 8) - 1개
  // ============================================
  { sidoName: "세종특별자치시", sigunguName: "세종시", areaCode: "8", sigunguCode: "1", isDepopulated: false, centerLat: 36.4800, centerLng: 127.0000 },

  // ============================================
  // 경기도 (areaCode: 31) - 31개 시·군
  // ============================================
  { sidoName: "경기도", sigunguName: "가평군", areaCode: "31", sigunguCode: "1", isDepopulated: true, centerLat: 37.8315, centerLng: 127.5106 },
  { sidoName: "경기도", sigunguName: "고양시", areaCode: "31", sigunguCode: "2", isDepopulated: false, centerLat: 37.6584, centerLng: 126.8320 },
  { sidoName: "경기도", sigunguName: "과천시", areaCode: "31", sigunguCode: "3", isDepopulated: false, centerLat: 37.4292, centerLng: 126.9876 },
  { sidoName: "경기도", sigunguName: "광명시", areaCode: "31", sigunguCode: "4", isDepopulated: false, centerLat: 37.4786, centerLng: 126.8644 },
  { sidoName: "경기도", sigunguName: "광주시", areaCode: "31", sigunguCode: "5", isDepopulated: false, centerLat: 37.4294, centerLng: 127.2551 },
  { sidoName: "경기도", sigunguName: "구리시", areaCode: "31", sigunguCode: "6", isDepopulated: false, centerLat: 37.5943, centerLng: 127.1295 },
  { sidoName: "경기도", sigunguName: "군포시", areaCode: "31", sigunguCode: "7", isDepopulated: false, centerLat: 37.3617, centerLng: 126.9352 },
  { sidoName: "경기도", sigunguName: "김포시", areaCode: "31", sigunguCode: "8", isDepopulated: false, centerLat: 37.6153, centerLng: 126.7156 },
  { sidoName: "경기도", sigunguName: "남양주시", areaCode: "31", sigunguCode: "9", isDepopulated: false, centerLat: 37.6360, centerLng: 127.2165 },
  { sidoName: "경기도", sigunguName: "동두천시", areaCode: "31", sigunguCode: "10", isDepopulated: true, centerLat: 37.9035, centerLng: 127.0606 },
  { sidoName: "경기도", sigunguName: "부천시", areaCode: "31", sigunguCode: "11", isDepopulated: false, centerLat: 37.5034, centerLng: 126.7660 },
  { sidoName: "경기도", sigunguName: "성남시", areaCode: "31", sigunguCode: "12", isDepopulated: false, centerLat: 37.4201, centerLng: 127.1265 },
  { sidoName: "경기도", sigunguName: "수원시", areaCode: "31", sigunguCode: "13", isDepopulated: false, centerLat: 37.2636, centerLng: 127.0286 },
  { sidoName: "경기도", sigunguName: "시흥시", areaCode: "31", sigunguCode: "14", isDepopulated: false, centerLat: 37.3800, centerLng: 126.8032 },
  { sidoName: "경기도", sigunguName: "안산시", areaCode: "31", sigunguCode: "15", isDepopulated: false, centerLat: 37.3219, centerLng: 126.8309 },
  { sidoName: "경기도", sigunguName: "안성시", areaCode: "31", sigunguCode: "16", isDepopulated: false, centerLat: 37.0080, centerLng: 127.2797 },
  { sidoName: "경기도", sigunguName: "안양시", areaCode: "31", sigunguCode: "17", isDepopulated: false, centerLat: 37.3943, centerLng: 126.9568 },
  { sidoName: "경기도", sigunguName: "양주시", areaCode: "31", sigunguCode: "18", isDepopulated: false, centerLat: 37.7854, centerLng: 127.0456 },
  { sidoName: "경기도", sigunguName: "양평군", areaCode: "31", sigunguCode: "19", isDepopulated: true, centerLat: 37.4917, centerLng: 127.4876 },
  { sidoName: "경기도", sigunguName: "여주시", areaCode: "31", sigunguCode: "20", isDepopulated: true, centerLat: 37.2985, centerLng: 127.6373 },
  { sidoName: "경기도", sigunguName: "연천군", areaCode: "31", sigunguCode: "21", isDepopulated: true, centerLat: 38.0965, centerLng: 127.0748 },
  { sidoName: "경기도", sigunguName: "오산시", areaCode: "31", sigunguCode: "22", isDepopulated: false, centerLat: 37.1496, centerLng: 127.0698 },
  { sidoName: "경기도", sigunguName: "용인시", areaCode: "31", sigunguCode: "23", isDepopulated: false, centerLat: 37.2411, centerLng: 127.1775 },
  { sidoName: "경기도", sigunguName: "의왕시", areaCode: "31", sigunguCode: "24", isDepopulated: false, centerLat: 37.3445, centerLng: 126.9686 },
  { sidoName: "경기도", sigunguName: "의정부시", areaCode: "31", sigunguCode: "25", isDepopulated: false, centerLat: 37.7381, centerLng: 127.0337 },
  { sidoName: "경기도", sigunguName: "이천시", areaCode: "31", sigunguCode: "26", isDepopulated: false, centerLat: 37.2720, centerLng: 127.4348 },
  { sidoName: "경기도", sigunguName: "파주시", areaCode: "31", sigunguCode: "27", isDepopulated: false, centerLat: 37.7590, centerLng: 126.7801 },
  { sidoName: "경기도", sigunguName: "평택시", areaCode: "31", sigunguCode: "28", isDepopulated: false, centerLat: 36.9921, centerLng: 127.0855 },
  { sidoName: "경기도", sigunguName: "포천시", areaCode: "31", sigunguCode: "29", isDepopulated: true, centerLat: 37.8949, centerLng: 127.2002 },
  { sidoName: "경기도", sigunguName: "하남시", areaCode: "31", sigunguCode: "30", isDepopulated: false, centerLat: 37.5393, centerLng: 127.2147 },
  { sidoName: "경기도", sigunguName: "화성시", areaCode: "31", sigunguCode: "31", isDepopulated: false, centerLat: 37.1994, centerLng: 126.8312 },

  // ============================================
  // 강원특별자치도 (areaCode: 32) - 18개 시·군
  // ============================================
  { sidoName: "강원특별자치도", sigunguName: "강릉시", areaCode: "32", sigunguCode: "1", isDepopulated: false, centerLat: 37.7519, centerLng: 128.8761 },
  { sidoName: "강원특별자치도", sigunguName: "고성군", areaCode: "32", sigunguCode: "2", isDepopulated: true, centerLat: 38.3800, centerLng: 128.4679 },
  { sidoName: "강원특별자치도", sigunguName: "동해시", areaCode: "32", sigunguCode: "3", isDepopulated: true, centerLat: 37.5247, centerLng: 129.1143 },
  { sidoName: "강원특별자치도", sigunguName: "삼척시", areaCode: "32", sigunguCode: "4", isDepopulated: true, centerLat: 37.4499, centerLng: 129.1650 },
  { sidoName: "강원특별자치도", sigunguName: "속초시", areaCode: "32", sigunguCode: "5", isDepopulated: false, centerLat: 38.2070, centerLng: 128.5918 },
  { sidoName: "강원특별자치도", sigunguName: "양구군", areaCode: "32", sigunguCode: "6", isDepopulated: true, centerLat: 38.1097, centerLng: 127.9897 },
  { sidoName: "강원특별자치도", sigunguName: "양양군", areaCode: "32", sigunguCode: "7", isDepopulated: true, centerLat: 38.0754, centerLng: 128.6189 },
  { sidoName: "강원특별자치도", sigunguName: "영월군", areaCode: "32", sigunguCode: "8", isDepopulated: true, centerLat: 37.1837, centerLng: 128.4617 },
  { sidoName: "강원특별자치도", sigunguName: "원주시", areaCode: "32", sigunguCode: "9", isDepopulated: false, centerLat: 37.3422, centerLng: 127.9202 },
  { sidoName: "강원특별자치도", sigunguName: "인제군", areaCode: "32", sigunguCode: "10", isDepopulated: true, centerLat: 38.0695, centerLng: 128.1704 },
  { sidoName: "강원특별자치도", sigunguName: "정선군", areaCode: "32", sigunguCode: "11", isDepopulated: true, centerLat: 37.3807, centerLng: 128.6609 },
  { sidoName: "강원특별자치도", sigunguName: "철원군", areaCode: "32", sigunguCode: "12", isDepopulated: true, centerLat: 38.1468, centerLng: 127.3133 },
  { sidoName: "강원특별자치도", sigunguName: "춘천시", areaCode: "32", sigunguCode: "13", isDepopulated: false, centerLat: 37.8813, centerLng: 127.7300 },
  { sidoName: "강원특별자치도", sigunguName: "태백시", areaCode: "32", sigunguCode: "14", isDepopulated: true, centerLat: 37.1641, centerLng: 128.9858 },
  { sidoName: "강원특별자치도", sigunguName: "평창군", areaCode: "32", sigunguCode: "15", isDepopulated: true, centerLat: 37.3707, centerLng: 128.3903 },
  { sidoName: "강원특별자치도", sigunguName: "홍천군", areaCode: "32", sigunguCode: "16", isDepopulated: true, centerLat: 37.6970, centerLng: 127.8885 },
  { sidoName: "강원특별자치도", sigunguName: "화천군", areaCode: "32", sigunguCode: "17", isDepopulated: true, centerLat: 38.1062, centerLng: 127.7082 },
  { sidoName: "강원특별자치도", sigunguName: "횡성군", areaCode: "32", sigunguCode: "18", isDepopulated: true, centerLat: 37.4887, centerLng: 127.9849 },

  // ============================================
  // 충청북도 (areaCode: 33) - 11개 시·군
  // ============================================
  { sidoName: "충청북도", sigunguName: "괴산군", areaCode: "33", sigunguCode: "1", isDepopulated: true, centerLat: 36.8153, centerLng: 127.7866 },
  { sidoName: "충청북도", sigunguName: "단양군", areaCode: "33", sigunguCode: "2", isDepopulated: true, centerLat: 36.9844, centerLng: 128.3655 },
  { sidoName: "충청북도", sigunguName: "보은군", areaCode: "33", sigunguCode: "3", isDepopulated: true, centerLat: 36.4890, centerLng: 127.7295 },
  { sidoName: "충청북도", sigunguName: "영동군", areaCode: "33", sigunguCode: "4", isDepopulated: true, centerLat: 36.1750, centerLng: 127.7836 },
  { sidoName: "충청북도", sigunguName: "옥천군", areaCode: "33", sigunguCode: "5", isDepopulated: true, centerLat: 36.3063, centerLng: 127.5714 },
  { sidoName: "충청북도", sigunguName: "음성군", areaCode: "33", sigunguCode: "6", isDepopulated: false, centerLat: 36.9400, centerLng: 127.6905 },
  { sidoName: "충청북도", sigunguName: "제천시", areaCode: "33", sigunguCode: "7", isDepopulated: true, centerLat: 37.1327, centerLng: 128.1900 },
  { sidoName: "충청북도", sigunguName: "증평군", areaCode: "33", sigunguCode: "8", isDepopulated: false, centerLat: 36.7856, centerLng: 127.5816 },
  { sidoName: "충청북도", sigunguName: "진천군", areaCode: "33", sigunguCode: "9", isDepopulated: false, centerLat: 36.8553, centerLng: 127.4356 },
  { sidoName: "충청북도", sigunguName: "청주시", areaCode: "33", sigunguCode: "10", isDepopulated: false, centerLat: 36.6424, centerLng: 127.4890 },
  { sidoName: "충청북도", sigunguName: "충주시", areaCode: "33", sigunguCode: "11", isDepopulated: false, centerLat: 36.9910, centerLng: 127.9259 },

  // ============================================
  // 충청남도 (areaCode: 34) - 15개 시·군
  // ============================================
  { sidoName: "충청남도", sigunguName: "계룡시", areaCode: "34", sigunguCode: "1", isDepopulated: false, centerLat: 36.2744, centerLng: 127.2486 },
  { sidoName: "충청남도", sigunguName: "공주시", areaCode: "34", sigunguCode: "2", isDepopulated: true, centerLat: 36.4465, centerLng: 127.1190 },
  { sidoName: "충청남도", sigunguName: "금산군", areaCode: "34", sigunguCode: "3", isDepopulated: true, centerLat: 36.1091, centerLng: 127.4880 },
  { sidoName: "충청남도", sigunguName: "논산시", areaCode: "34", sigunguCode: "4", isDepopulated: true, centerLat: 36.1872, centerLng: 127.0987 },
  { sidoName: "충청남도", sigunguName: "당진시", areaCode: "34", sigunguCode: "5", isDepopulated: false, centerLat: 36.8899, centerLng: 126.6462 },
  { sidoName: "충청남도", sigunguName: "보령시", areaCode: "34", sigunguCode: "6", isDepopulated: true, centerLat: 36.3334, centerLng: 126.6126 },
  { sidoName: "충청남도", sigunguName: "부여군", areaCode: "34", sigunguCode: "7", isDepopulated: true, centerLat: 36.2756, centerLng: 126.9098 },
  { sidoName: "충청남도", sigunguName: "서산시", areaCode: "34", sigunguCode: "8", isDepopulated: false, centerLat: 36.7845, centerLng: 126.4503 },
  { sidoName: "충청남도", sigunguName: "서천군", areaCode: "34", sigunguCode: "9", isDepopulated: true, centerLat: 36.0801, centerLng: 126.6916 },
  { sidoName: "충청남도", sigunguName: "아산시", areaCode: "34", sigunguCode: "10", isDepopulated: false, centerLat: 36.7898, centerLng: 127.0018 },
  { sidoName: "충청남도", sigunguName: "예산군", areaCode: "34", sigunguCode: "11", isDepopulated: true, centerLat: 36.6828, centerLng: 126.8492 },
  { sidoName: "충청남도", sigunguName: "천안시", areaCode: "34", sigunguCode: "12", isDepopulated: false, centerLat: 36.8151, centerLng: 127.1139 },
  { sidoName: "충청남도", sigunguName: "청양군", areaCode: "34", sigunguCode: "13", isDepopulated: true, centerLat: 36.4592, centerLng: 126.8022 },
  { sidoName: "충청남도", sigunguName: "태안군", areaCode: "34", sigunguCode: "14", isDepopulated: true, centerLat: 36.7457, centerLng: 126.2979 },
  { sidoName: "충청남도", sigunguName: "홍성군", areaCode: "34", sigunguCode: "15", isDepopulated: false, centerLat: 36.6010, centerLng: 126.6605 },

  // ============================================
  // 경상북도 (areaCode: 35) - 23개 시·군
  // ============================================
  { sidoName: "경상북도", sigunguName: "경산시", areaCode: "35", sigunguCode: "1", isDepopulated: false, centerLat: 35.8251, centerLng: 128.7414 },
  { sidoName: "경상북도", sigunguName: "경주시", areaCode: "35", sigunguCode: "2", isDepopulated: false, centerLat: 35.8562, centerLng: 129.2247 },
  { sidoName: "경상북도", sigunguName: "고령군", areaCode: "35", sigunguCode: "3", isDepopulated: true, centerLat: 35.7264, centerLng: 128.2632 },
  { sidoName: "경상북도", sigunguName: "구미시", areaCode: "35", sigunguCode: "4", isDepopulated: false, centerLat: 36.1198, centerLng: 128.3440 },
  { sidoName: "경상북도", sigunguName: "군위군", areaCode: "35", sigunguCode: "5", isDepopulated: true, centerLat: 36.2428, centerLng: 128.5727 },
  { sidoName: "경상북도", sigunguName: "김천시", areaCode: "35", sigunguCode: "6", isDepopulated: true, centerLat: 36.1398, centerLng: 128.1136 },
  { sidoName: "경상북도", sigunguName: "문경시", areaCode: "35", sigunguCode: "7", isDepopulated: true, centerLat: 36.5864, centerLng: 128.1868 },
  { sidoName: "경상북도", sigunguName: "봉화군", areaCode: "35", sigunguCode: "8", isDepopulated: true, centerLat: 36.8932, centerLng: 128.7323 },
  { sidoName: "경상북도", sigunguName: "상주시", areaCode: "35", sigunguCode: "9", isDepopulated: true, centerLat: 36.4107, centerLng: 128.1593 },
  { sidoName: "경상북도", sigunguName: "성주군", areaCode: "35", sigunguCode: "10", isDepopulated: true, centerLat: 35.9191, centerLng: 128.2831 },
  { sidoName: "경상북도", sigunguName: "안동시", areaCode: "35", sigunguCode: "11", isDepopulated: true, centerLat: 36.5684, centerLng: 128.7294 },
  { sidoName: "경상북도", sigunguName: "영덕군", areaCode: "35", sigunguCode: "12", isDepopulated: true, centerLat: 36.4150, centerLng: 129.3656 },
  { sidoName: "경상북도", sigunguName: "영양군", areaCode: "35", sigunguCode: "13", isDepopulated: true, centerLat: 36.6668, centerLng: 129.1124 },
  { sidoName: "경상북도", sigunguName: "영주시", areaCode: "35", sigunguCode: "14", isDepopulated: true, centerLat: 36.8057, centerLng: 128.6240 },
  { sidoName: "경상북도", sigunguName: "영천시", areaCode: "35", sigunguCode: "15", isDepopulated: true, centerLat: 35.9733, centerLng: 128.9385 },
  { sidoName: "경상북도", sigunguName: "예천군", areaCode: "35", sigunguCode: "16", isDepopulated: true, centerLat: 36.6572, centerLng: 128.4529 },
  { sidoName: "경상북도", sigunguName: "울릉군", areaCode: "35", sigunguCode: "17", isDepopulated: true, centerLat: 37.4846, centerLng: 130.9057 },
  { sidoName: "경상북도", sigunguName: "울진군", areaCode: "35", sigunguCode: "18", isDepopulated: true, centerLat: 36.9930, centerLng: 129.4002 },
  { sidoName: "경상북도", sigunguName: "의성군", areaCode: "35", sigunguCode: "19", isDepopulated: true, centerLat: 36.3527, centerLng: 128.6970 },
  { sidoName: "경상북도", sigunguName: "청도군", areaCode: "35", sigunguCode: "20", isDepopulated: true, centerLat: 35.6472, centerLng: 128.7340 },
  { sidoName: "경상북도", sigunguName: "청송군", areaCode: "35", sigunguCode: "21", isDepopulated: true, centerLat: 36.4363, centerLng: 129.0570 },
  { sidoName: "경상북도", sigunguName: "칠곡군", areaCode: "35", sigunguCode: "22", isDepopulated: false, centerLat: 35.9955, centerLng: 128.4016 },
  { sidoName: "경상북도", sigunguName: "포항시", areaCode: "35", sigunguCode: "23", isDepopulated: false, centerLat: 36.0190, centerLng: 129.3435 },

  // ============================================
  // 경상남도 (areaCode: 36) - 18개 시·군
  // ============================================
  { sidoName: "경상남도", sigunguName: "거제시", areaCode: "36", sigunguCode: "1", isDepopulated: false, centerLat: 34.8806, centerLng: 128.6211 },
  { sidoName: "경상남도", sigunguName: "거창군", areaCode: "36", sigunguCode: "2", isDepopulated: true, centerLat: 35.6868, centerLng: 127.9093 },
  { sidoName: "경상남도", sigunguName: "고성군", areaCode: "36", sigunguCode: "3", isDepopulated: true, centerLat: 34.9732, centerLng: 128.3228 },
  { sidoName: "경상남도", sigunguName: "김해시", areaCode: "36", sigunguCode: "4", isDepopulated: false, centerLat: 35.2285, centerLng: 128.8894 },
  { sidoName: "경상남도", sigunguName: "남해군", areaCode: "36", sigunguCode: "5", isDepopulated: true, centerLat: 34.8376, centerLng: 127.8924 },
  { sidoName: "경상남도", sigunguName: "밀양시", areaCode: "36", sigunguCode: "6", isDepopulated: true, centerLat: 35.5037, centerLng: 128.7466 },
  { sidoName: "경상남도", sigunguName: "사천시", areaCode: "36", sigunguCode: "7", isDepopulated: true, centerLat: 35.0032, centerLng: 128.0642 },
  { sidoName: "경상남도", sigunguName: "산청군", areaCode: "36", sigunguCode: "8", isDepopulated: true, centerLat: 35.4155, centerLng: 127.8732 },
  { sidoName: "경상남도", sigunguName: "양산시", areaCode: "36", sigunguCode: "9", isDepopulated: false, centerLat: 35.3350, centerLng: 129.0373 },
  { sidoName: "경상남도", sigunguName: "의령군", areaCode: "36", sigunguCode: "10", isDepopulated: true, centerLat: 35.3223, centerLng: 128.2614 },
  { sidoName: "경상남도", sigunguName: "진주시", areaCode: "36", sigunguCode: "11", isDepopulated: false, centerLat: 35.1800, centerLng: 128.1076 },
  { sidoName: "경상남도", sigunguName: "창녕군", areaCode: "36", sigunguCode: "12", isDepopulated: true, centerLat: 35.5442, centerLng: 128.4923 },
  { sidoName: "경상남도", sigunguName: "창원시", areaCode: "36", sigunguCode: "13", isDepopulated: false, centerLat: 35.2282, centerLng: 128.6811 },
  { sidoName: "경상남도", sigunguName: "통영시", areaCode: "36", sigunguCode: "14", isDepopulated: true, centerLat: 34.8544, centerLng: 128.4331 },
  { sidoName: "경상남도", sigunguName: "하동군", areaCode: "36", sigunguCode: "15", isDepopulated: true, centerLat: 35.0673, centerLng: 127.7513 },
  { sidoName: "경상남도", sigunguName: "함안군", areaCode: "36", sigunguCode: "16", isDepopulated: true, centerLat: 35.2722, centerLng: 128.4065 },
  { sidoName: "경상남도", sigunguName: "함양군", areaCode: "36", sigunguCode: "17", isDepopulated: true, centerLat: 35.5200, centerLng: 127.7252 },
  { sidoName: "경상남도", sigunguName: "합천군", areaCode: "36", sigunguCode: "18", isDepopulated: true, centerLat: 35.5667, centerLng: 128.1657 },

  // ============================================
  // 전라북도 (areaCode: 37) - 14개 시·군
  // ============================================
  { sidoName: "전북특별자치도", sigunguName: "고창군", areaCode: "37", sigunguCode: "1", isDepopulated: true, centerLat: 35.4358, centerLng: 126.7020 },
  { sidoName: "전북특별자치도", sigunguName: "군산시", areaCode: "37", sigunguCode: "2", isDepopulated: false, centerLat: 35.9676, centerLng: 126.7369 },
  { sidoName: "전북특별자치도", sigunguName: "김제시", areaCode: "37", sigunguCode: "3", isDepopulated: true, centerLat: 35.8034, centerLng: 126.8808 },
  { sidoName: "전북특별자치도", sigunguName: "남원시", areaCode: "37", sigunguCode: "4", isDepopulated: true, centerLat: 35.4164, centerLng: 127.3907 },
  { sidoName: "전북특별자치도", sigunguName: "무주군", areaCode: "37", sigunguCode: "5", isDepopulated: true, centerLat: 36.0068, centerLng: 127.6609 },
  { sidoName: "전북특별자치도", sigunguName: "부안군", areaCode: "37", sigunguCode: "6", isDepopulated: true, centerLat: 35.7316, centerLng: 126.7337 },
  { sidoName: "전북특별자치도", sigunguName: "순창군", areaCode: "37", sigunguCode: "7", isDepopulated: true, centerLat: 35.3742, centerLng: 127.1376 },
  { sidoName: "전북특별자치도", sigunguName: "완주군", areaCode: "37", sigunguCode: "8", isDepopulated: false, centerLat: 35.9044, centerLng: 127.1620 },
  { sidoName: "전북특별자치도", sigunguName: "익산시", areaCode: "37", sigunguCode: "9", isDepopulated: false, centerLat: 35.9483, centerLng: 126.9576 },
  { sidoName: "전북특별자치도", sigunguName: "임실군", areaCode: "37", sigunguCode: "10", isDepopulated: true, centerLat: 35.6177, centerLng: 127.2790 },
  { sidoName: "전북특별자치도", sigunguName: "장수군", areaCode: "37", sigunguCode: "11", isDepopulated: true, centerLat: 35.6475, centerLng: 127.5214 },
  { sidoName: "전북특별자치도", sigunguName: "전주시", areaCode: "37", sigunguCode: "12", isDepopulated: false, centerLat: 35.8242, centerLng: 127.1480 },
  { sidoName: "전북특별자치도", sigunguName: "정읍시", areaCode: "37", sigunguCode: "13", isDepopulated: true, centerLat: 35.5699, centerLng: 126.8560 },
  { sidoName: "전북특별자치도", sigunguName: "진안군", areaCode: "37", sigunguCode: "14", isDepopulated: true, centerLat: 35.7917, centerLng: 127.4249 },

  // ============================================
  // 전라남도 (areaCode: 38) - 22개 시·군
  // ============================================
  { sidoName: "전라남도", sigunguName: "강진군", areaCode: "38", sigunguCode: "1", isDepopulated: true, centerLat: 34.6421, centerLng: 126.7673 },
  { sidoName: "전라남도", sigunguName: "고흥군", areaCode: "38", sigunguCode: "2", isDepopulated: true, centerLat: 34.6110, centerLng: 127.2847 },
  { sidoName: "전라남도", sigunguName: "곡성군", areaCode: "38", sigunguCode: "3", isDepopulated: true, centerLat: 35.2819, centerLng: 127.2922 },
  { sidoName: "전라남도", sigunguName: "광양시", areaCode: "38", sigunguCode: "4", isDepopulated: false, centerLat: 34.9407, centerLng: 127.6958 },
  { sidoName: "전라남도", sigunguName: "구례군", areaCode: "38", sigunguCode: "5", isDepopulated: true, centerLat: 35.2025, centerLng: 127.4627 },
  { sidoName: "전라남도", sigunguName: "나주시", areaCode: "38", sigunguCode: "6", isDepopulated: false, centerLat: 35.0159, centerLng: 126.7109 },
  { sidoName: "전라남도", sigunguName: "담양군", areaCode: "38", sigunguCode: "7", isDepopulated: true, centerLat: 35.3213, centerLng: 126.9883 },
  { sidoName: "전라남도", sigunguName: "목포시", areaCode: "38", sigunguCode: "8", isDepopulated: false, centerLat: 34.8118, centerLng: 126.3922 },
  { sidoName: "전라남도", sigunguName: "무안군", areaCode: "38", sigunguCode: "9", isDepopulated: false, centerLat: 34.9900, centerLng: 126.4815 },
  { sidoName: "전라남도", sigunguName: "보성군", areaCode: "38", sigunguCode: "10", isDepopulated: true, centerLat: 34.7714, centerLng: 127.0800 },
  { sidoName: "전라남도", sigunguName: "순천시", areaCode: "38", sigunguCode: "11", isDepopulated: false, centerLat: 34.9506, centerLng: 127.4872 },
  { sidoName: "전라남도", sigunguName: "신안군", areaCode: "38", sigunguCode: "12", isDepopulated: true, centerLat: 34.8274, centerLng: 126.1072 },
  { sidoName: "전라남도", sigunguName: "여수시", areaCode: "38", sigunguCode: "13", isDepopulated: false, centerLat: 34.7604, centerLng: 127.6622 },
  { sidoName: "전라남도", sigunguName: "영광군", areaCode: "38", sigunguCode: "14", isDepopulated: true, centerLat: 35.2772, centerLng: 126.5121 },
  { sidoName: "전라남도", sigunguName: "영암군", areaCode: "38", sigunguCode: "15", isDepopulated: true, centerLat: 34.8001, centerLng: 126.6965 },
  { sidoName: "전라남도", sigunguName: "완도군", areaCode: "38", sigunguCode: "16", isDepopulated: true, centerLat: 34.3109, centerLng: 126.7550 },
  { sidoName: "전라남도", sigunguName: "장성군", areaCode: "38", sigunguCode: "17", isDepopulated: true, centerLat: 35.3020, centerLng: 126.7846 },
  { sidoName: "전라남도", sigunguName: "장흥군", areaCode: "38", sigunguCode: "18", isDepopulated: true, centerLat: 34.6816, centerLng: 126.9070 },
  { sidoName: "전라남도", sigunguName: "진도군", areaCode: "38", sigunguCode: "19", isDepopulated: true, centerLat: 34.4869, centerLng: 126.2634 },
  { sidoName: "전라남도", sigunguName: "함평군", areaCode: "38", sigunguCode: "20", isDepopulated: true, centerLat: 35.0654, centerLng: 126.5161 },
  { sidoName: "전라남도", sigunguName: "해남군", areaCode: "38", sigunguCode: "21", isDepopulated: true, centerLat: 34.5735, centerLng: 126.5990 },
  { sidoName: "전라남도", sigunguName: "화순군", areaCode: "38", sigunguCode: "22", isDepopulated: true, centerLat: 35.0644, centerLng: 126.9866 },

  // ============================================
  // 제주특별자치도 (areaCode: 39) - 2개 시
  // ============================================
  { sidoName: "제주특별자치도", sigunguName: "제주시", areaCode: "39", sigunguCode: "1", isDepopulated: false, centerLat: 33.4996, centerLng: 126.5312 },
  { sidoName: "제주특별자치도", sigunguName: "서귀포시", areaCode: "39", sigunguCode: "2", isDepopulated: false, centerLat: 33.2541, centerLng: 126.5600 },
];

async function main() {
  console.log("🌱 228개 기초자치단체 마스터 데이터 시딩 시작...\n");

  let created = 0;
  let updated = 0;

  for (const region of regions) {
    const isCityCounty = resolveIsCityCounty(region);
    const result = await prisma.region.upsert({
      where: {
        areaCode_sigunguCode: {
          areaCode: region.areaCode,
          sigunguCode: region.sigunguCode,
        },
      },
      update: {
        sidoName: region.sidoName,
        sigunguName: region.sigunguName,
        isDepopulated: region.isDepopulated,
        isCityCounty,
        centerLat: region.centerLat,
        centerLng: region.centerLng,
      },
      create: {
        sidoName: region.sidoName,
        sigunguName: region.sigunguName,
        areaCode: region.areaCode,
        sigunguCode: region.sigunguCode,
        isDepopulated: region.isDepopulated,
        isCityCounty,
        centerLat: region.centerLat,
        centerLng: region.centerLng,
      },
    });

    // 간단한 통계 (실제로는 upsert가 create인지 update인지 알기 어려우므로 총 개수만 표시)
    created++;
  }

  const depopulatedCount = regions.filter((r) => r.isDepopulated).length;
  const cityCountyCount = regions.filter(resolveIsCityCounty).length;
  const sidoCount = new Set(regions.map((r) => r.sidoName)).size;

  console.log(`✅ 시딩 완료!`);
  console.log(`   📍 총 ${regions.length}개 기초자치단체`);
  console.log(`   🏛️  ${sidoCount}개 광역자치단체`);
  console.log(`   🏙️  시·군 단위: ${cityCountyCount}개 (자치구 ${regions.length - cityCountyCount}개 제외)`);
  console.log(`   🔴 인구감소지역: ${depopulatedCount}개`);
  console.log(`   🟢 일반지역: ${regions.length - depopulatedCount}개`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ 시딩 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
