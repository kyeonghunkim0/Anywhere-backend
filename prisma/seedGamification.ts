import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

/**
 * 큐레이션 해시태그 (홈 화면 상단 감성 태그 칩)
 */
const tags = [
  { label: "#밤하늘_별맛집", emoji: "✨" },
  { label: "#현지인_추천_노포", emoji: "🍚" },
  { label: "#바다향기", emoji: "🌊" },
  { label: "#골목_산책", emoji: "🚶" },
  { label: "#숨은_출사명소", emoji: "📷" },
];

/**
 * 스페셜 퀘스트(SEASONAL) - 실제 지역 축제 기반 시즌 한정 뱃지 10종
 *
 * 아이콘 정책 (2026-09-10 업데이트)
 * - 각 축제의 실제 공식 로고/포스터 이미지를 사용한다. (씰 글리프 오버레이 방식 폐기)
 * - `icon`은 `badges/<slug>.png` 상대 경로이며 assets/badges/ 에 실제 파일로 존재한다.
 *   서버가 `/static/badges/<slug>.png` 로 서빙한다 (toPublicAssetUrl).
 * - key에 연도를 넣는다. 같은 축제라도 2026과 2027은 다른 수집품이다.
 *
 * 기간 규칙
 * - `startAt` = 축제 시작 30일 전 (퀘스트 오픈일). 홈 캐러셀에 미리 떠서 여행 계획을 만든다.
 * - `endAt`   = 축제 종료일. D-day 카운트다운의 기준이다.
 * - ⚠️ 축제 일정은 매년 지자체가 확정 공고한다. 아래 날짜는 예년 개최 시기 기준의
 *   운영 초기값이므로, 시즌 진입 전에 지자체 공고로 반드시 갱신해야 한다.
 */
const seasonalQuests = [
  {
    key: "jinhae_gunhangje_2027",
    name: "진해 군항제 2027",
    description: "벚꽃이 가장 짙은 날 창원에서 도장을 찍어보세요.",
    icon: "badges/jinhae-gunhangje-2027.png",
    sidoName: "경상남도",
    sigunguName: "창원시",
    startAt: new Date("2027-02-25"),
    endAt: new Date("2027-04-05"),
  },
  {
    key: "hampyeong_butterfly_2027",
    name: "함평 나비대축제 2027",
    description: "나비가 돌아오는 봄, 함평 들판에서만 열리는 퀘스트.",
    icon: "badges/hampyeong-butterfly-2027.png",
    sidoName: "전라남도",
    sigunguName: "함평군",
    startAt: new Date("2027-03-25"),
    endAt: new Date("2027-05-05"),
  },
  {
    key: "boryeong_mud_2027",
    name: "보령 머드축제 2027",
    description: "대천해수욕장의 여름. 진흙투성이가 되어도 도장은 남습니다.",
    icon: "badges/boryeong-mud-2027.png",
    sidoName: "충청남도",
    sigunguName: "보령시",
    startAt: new Date("2027-06-17"),
    endAt: new Date("2027-07-26"),
  },
  {
    key: "bonghwa_sweetfish_2027",
    name: "봉화 은어축제 2027",
    description: "내성천 맑은 물에 은어가 오르는 열흘 동안만 열립니다.",
    icon: "badges/bonghwa-sweetfish-2027.png",
    sidoName: "경상북도",
    sigunguName: "봉화군",
    startAt: new Date("2027-06-24"),
    endAt: new Date("2027-08-01"),
  },
  {
    key: "jeongseon_arirang_2026",
    name: "정선아리랑제 2026",
    description: "아우라지에 가을이 내려앉는 나흘. 정선에서만 받는 도장.",
    icon: "badges/jeongseon-arirang-2026.png",
    sidoName: "강원특별자치도",
    sigunguName: "정선군",
    startAt: new Date("2026-08-25"),
    endAt: new Date("2026-09-27"),
  },
  {
    key: "jinju_lantern_2026",
    name: "진주남강유등축제 2026",
    description: "남강에 유등이 뜨는 밤에만 켜지는 퀘스트.",
    icon: "badges/jinju-lantern-2026.png",
    sidoName: "경상남도",
    sigunguName: "진주시",
    startAt: new Date("2026-09-01"),
    endAt: new Date("2026-10-11"),
  },
  {
    key: "gimje_horizon_2026",
    name: "김제 지평선축제 2026",
    description: "지평선이 보이는 유일한 들녘, 벽골제에서 찍는 가을 도장.",
    icon: "badges/gimje-horizon-2026.png",
    sidoName: "전북특별자치도",
    sigunguName: "김제시",
    startAt: new Date("2026-09-07"),
    endAt: new Date("2026-10-11"),
  },
  {
    key: "yeongdong_nangye_2026",
    name: "영동 난계국악축제 2026",
    description: "국악의 고장 영동에서 사흘 동안만 열리는 소리 퀘스트.",
    icon: "badges/yeongdong-nangye-2026.png",
    sidoName: "충청북도",
    sigunguName: "영동군",
    startAt: new Date("2026-09-09"),
    endAt: new Date("2026-10-11"),
  },
  {
    key: "hwacheon_ice_2027",
    name: "화천 산천어축제 2027",
    description: "얼어붙은 화천천 위에서만 받을 수 있는 한겨울 도장.",
    icon: "badges/hwacheon-ice-2027.png",
    sidoName: "강원특별자치도",
    sigunguName: "화천군",
    startAt: new Date("2026-12-10"),
    endAt: new Date("2027-01-31"),
  },
  {
    key: "taebaek_snow_2027",
    name: "태백산 눈축제 2027",
    description: "해발 1,567m 눈꽃 아래. 겨울 태백에서만 열립니다.",
    icon: "badges/taebaek-snow-2027.png",
    sidoName: "강원특별자치도",
    sigunguName: "태백시",
    startAt: new Date("2026-12-23"),
    endAt: new Date("2027-01-31"),
  },
];

/**
 * 지역(REGION) 뱃지 - 기초자치단체 수집판 뱃지 (지역 1곳 = 뱃지 1개)
 * - regionId(시·도 + 시·군·구)로 지역에 연결한다. 좌표(lat/lng)는 없다.
 * - icon 값은 assets/badges/<icon>.png 파일과 1:1로 대응하며,
 *   DB에는 `badges/<icon>.png` 상대 경로로 저장한다. (서버가 /static 으로 서빙)
 */
const regionBadges = [
  // 충청북도
  { key: "chungbuk_boeun", icon: "chungbuk-boeun", sidoName: "충청북도", sigunguName: "보은군" },
  { key: "chungbuk_cheongju", icon: "chungbuk-cheongju", sidoName: "충청북도", sigunguName: "청주시" },
  { key: "chungbuk_chungju", icon: "chungbuk-chungju", sidoName: "충청북도", sigunguName: "충주시" },
  { key: "chungbuk_danyang", icon: "chungbuk-danyang", sidoName: "충청북도", sigunguName: "단양군" },
  { key: "chungbuk_eumseong", icon: "chungbuk-eumseong", sidoName: "충청북도", sigunguName: "음성군" },
  { key: "chungbuk_goesan", icon: "chungbuk-goesan", sidoName: "충청북도", sigunguName: "괴산군" },
  { key: "chungbuk_jecheon", icon: "chungbuk-jecheon", sidoName: "충청북도", sigunguName: "제천시" },
  { key: "chungbuk_jeungpyeong", icon: "chungbuk-jeungpyeong", sidoName: "충청북도", sigunguName: "증평군" },
  { key: "chungbuk_jincheon", icon: "chungbuk-jincheon", sidoName: "충청북도", sigunguName: "진천군" },
  { key: "chungbuk_okcheon", icon: "chungbuk-okcheon", sidoName: "충청북도", sigunguName: "옥천군" },
  { key: "chungbuk_yeongdong", icon: "chungbuk-yeongdong", sidoName: "충청북도", sigunguName: "영동군" },
  // 충청남도
  { key: "chungnam_asan", icon: "chungnam-asan", sidoName: "충청남도", sigunguName: "아산시" },
  { key: "chungnam_boryeong", icon: "chungnam-boryeong", sidoName: "충청남도", sigunguName: "보령시" },
  { key: "chungnam_buyeo", icon: "chungnam-buyeo", sidoName: "충청남도", sigunguName: "부여군" },
  { key: "chungnam_cheonan", icon: "chungnam-cheonan", sidoName: "충청남도", sigunguName: "천안시" },
  { key: "chungnam_cheongyang", icon: "chungnam-cheongyang", sidoName: "충청남도", sigunguName: "청양군" },
  { key: "chungnam_dangjin", icon: "chungnam-dangjin", sidoName: "충청남도", sigunguName: "당진시" },
  { key: "chungnam_geumsan", icon: "chungnam-geumsan", sidoName: "충청남도", sigunguName: "금산군" },
  { key: "chungnam_gongju", icon: "chungnam-gongju", sidoName: "충청남도", sigunguName: "공주시" },
  { key: "chungnam_gyeryong", icon: "chungnam-gyeryong", sidoName: "충청남도", sigunguName: "계룡시" },
  { key: "chungnam_hongseong", icon: "chungnam-hongseong", sidoName: "충청남도", sigunguName: "홍성군" },
  { key: "chungnam_nonsan", icon: "chungnam-nonsan", sidoName: "충청남도", sigunguName: "논산시" },
  { key: "chungnam_seocheon", icon: "chungnam-seocheon", sidoName: "충청남도", sigunguName: "서천군" },
  { key: "chungnam_seosan", icon: "chungnam-seosan", sidoName: "충청남도", sigunguName: "서산시" },
  { key: "chungnam_taean", icon: "chungnam-taean", sidoName: "충청남도", sigunguName: "태안군" },
  { key: "chungnam_yesan", icon: "chungnam-yesan", sidoName: "충청남도", sigunguName: "예산군" },
  // 강원특별자치도
  { key: "gangwon_cheorwon", icon: "gangwon-cheorwon", sidoName: "강원특별자치도", sigunguName: "철원군" },
  { key: "gangwon_chuncheon", icon: "gangwon-chuncheon", sidoName: "강원특별자치도", sigunguName: "춘천시" },
  { key: "gangwon_donghae", icon: "gangwon-donghae", sidoName: "강원특별자치도", sigunguName: "동해시" },
  { key: "gangwon_gangneung", icon: "gangwon-gangneung", sidoName: "강원특별자치도", sigunguName: "강릉시" },
  { key: "gangwon_goseong", icon: "gangwon-goseong", sidoName: "강원특별자치도", sigunguName: "고성군" },
  { key: "gangwon_hoengseong", icon: "gangwon-hoengseong", sidoName: "강원특별자치도", sigunguName: "횡성군" },
  { key: "gangwon_hongcheon", icon: "gangwon-hongcheon", sidoName: "강원특별자치도", sigunguName: "홍천군" },
  { key: "gangwon_hwacheon", icon: "gangwon-hwacheon", sidoName: "강원특별자치도", sigunguName: "화천군" },
  { key: "gangwon_inje", icon: "gangwon-inje", sidoName: "강원특별자치도", sigunguName: "인제군" },
  { key: "gangwon_jeongseon", icon: "gangwon-jeongseon", sidoName: "강원특별자치도", sigunguName: "정선군" },
  { key: "gangwon_pyeongchang", icon: "gangwon-pyeongchang", sidoName: "강원특별자치도", sigunguName: "평창군" },
  { key: "gangwon_samcheok", icon: "gangwon-samcheok", sidoName: "강원특별자치도", sigunguName: "삼척시" },
  { key: "gangwon_sokcho", icon: "gangwon-sokcho", sidoName: "강원특별자치도", sigunguName: "속초시" },
  { key: "gangwon_taebaek", icon: "gangwon-taebaek", sidoName: "강원특별자치도", sigunguName: "태백시" },
  { key: "gangwon_wonju", icon: "gangwon-wonju", sidoName: "강원특별자치도", sigunguName: "원주시" },
  { key: "gangwon_yanggu", icon: "gangwon-yanggu", sidoName: "강원특별자치도", sigunguName: "양구군" },
  { key: "gangwon_yangyang", icon: "gangwon-yangyang", sidoName: "강원특별자치도", sigunguName: "양양군" },
  { key: "gangwon_yeongwol", icon: "gangwon-yeongwol", sidoName: "강원특별자치도", sigunguName: "영월군" },
  // 경기도
  { key: "gyeonggi_ansan", icon: "gyeonggi-ansan", sidoName: "경기도", sigunguName: "안산시" },
  { key: "gyeonggi_anseong", icon: "gyeonggi-anseong", sidoName: "경기도", sigunguName: "안성시" },
  { key: "gyeonggi_anyang", icon: "gyeonggi-anyang", sidoName: "경기도", sigunguName: "안양시" },
  { key: "gyeonggi_bucheon", icon: "gyeonggi-bucheon", sidoName: "경기도", sigunguName: "부천시" },
  { key: "gyeonggi_dongducheon", icon: "gyeonggi-dongducheon", sidoName: "경기도", sigunguName: "동두천시" },
  { key: "gyeonggi_gapyeong", icon: "gyeonggi-gapyeong", sidoName: "경기도", sigunguName: "가평군" },
  { key: "gyeonggi_gimpo", icon: "gyeonggi-gimpo", sidoName: "경기도", sigunguName: "김포시" },
  { key: "gyeonggi_goyang", icon: "gyeonggi-goyang", sidoName: "경기도", sigunguName: "고양시" },
  { key: "gyeonggi_gunpo", icon: "gyeonggi-gunpo", sidoName: "경기도", sigunguName: "군포시" },
  { key: "gyeonggi_guri", icon: "gyeonggi-guri", sidoName: "경기도", sigunguName: "구리시" },
  { key: "gyeonggi_gwacheon", icon: "gyeonggi-gwacheon", sidoName: "경기도", sigunguName: "과천시" },
  { key: "gyeonggi_gwangju", icon: "gyeonggi-gwangju", sidoName: "경기도", sigunguName: "광주시" },
  { key: "gyeonggi_gwangmyeong", icon: "gyeonggi-gwangmyeong", sidoName: "경기도", sigunguName: "광명시" },
  { key: "gyeonggi_hanam", icon: "gyeonggi-hanam", sidoName: "경기도", sigunguName: "하남시" },
  { key: "gyeonggi_hwaseong", icon: "gyeonggi-hwaseong", sidoName: "경기도", sigunguName: "화성시" },
  { key: "gyeonggi_icheon", icon: "gyeonggi-icheon", sidoName: "경기도", sigunguName: "이천시" },
  { key: "gyeonggi_namyangju", icon: "gyeonggi-namyangju", sidoName: "경기도", sigunguName: "남양주시" },
  { key: "gyeonggi_osan", icon: "gyeonggi-osan", sidoName: "경기도", sigunguName: "오산시" },
  { key: "gyeonggi_paju", icon: "gyeonggi-paju", sidoName: "경기도", sigunguName: "파주시" },
  { key: "gyeonggi_pocheon", icon: "gyeonggi-pocheon", sidoName: "경기도", sigunguName: "포천시" },
  { key: "gyeonggi_pyeongtaek", icon: "gyeonggi-pyeongtaek", sidoName: "경기도", sigunguName: "평택시" },
  { key: "gyeonggi_seongnam", icon: "gyeonggi-seongnam", sidoName: "경기도", sigunguName: "성남시" },
  { key: "gyeonggi_siheung", icon: "gyeonggi-siheung", sidoName: "경기도", sigunguName: "시흥시" },
  { key: "gyeonggi_suwon", icon: "gyeonggi-suwon", sidoName: "경기도", sigunguName: "수원시" },
  { key: "gyeonggi_uijeongbu", icon: "gyeonggi-uijeongbu", sidoName: "경기도", sigunguName: "의정부시" },
  { key: "gyeonggi_uiwang", icon: "gyeonggi-uiwang", sidoName: "경기도", sigunguName: "의왕시" },
  { key: "gyeonggi_yangju", icon: "gyeonggi-yangju", sidoName: "경기도", sigunguName: "양주시" },
  { key: "gyeonggi_yangpyeong", icon: "gyeonggi-yangpyeong", sidoName: "경기도", sigunguName: "양평군" },
  { key: "gyeonggi_yeoju", icon: "gyeonggi-yeoju", sidoName: "경기도", sigunguName: "여주시" },
  { key: "gyeonggi_yeoncheon", icon: "gyeonggi-yeoncheon", sidoName: "경기도", sigunguName: "연천군" },
  { key: "gyeonggi_yongin", icon: "gyeonggi-yongin", sidoName: "경기도", sigunguName: "용인시" },
  // 경상북도
  { key: "gyeongbuk_andong", icon: "gyeongbuk-andong", sidoName: "경상북도", sigunguName: "안동시" },
  { key: "gyeongbuk_bonghwa", icon: "gyeongbuk-bonghwa", sidoName: "경상북도", sigunguName: "봉화군" },
  { key: "gyeongbuk_cheongdo", icon: "gyeongbuk-cheongdo", sidoName: "경상북도", sigunguName: "청도군" },
  { key: "gyeongbuk_cheongsong", icon: "gyeongbuk-cheongsong", sidoName: "경상북도", sigunguName: "청송군" },
  { key: "gyeongbuk_chilgok", icon: "gyeongbuk-chilgok", sidoName: "경상북도", sigunguName: "칠곡군" },
  { key: "gyeongbuk_gimcheon", icon: "gyeongbuk-gimcheon", sidoName: "경상북도", sigunguName: "김천시" },
  { key: "gyeongbuk_goryeong", icon: "gyeongbuk-goryeong", sidoName: "경상북도", sigunguName: "고령군" },
  { key: "gyeongbuk_gumi", icon: "gyeongbuk-gumi", sidoName: "경상북도", sigunguName: "구미시" },
  { key: "gyeongbuk_gunwi", icon: "gyeongbuk-gunwi", sidoName: "경상북도", sigunguName: "군위군" },
  { key: "gyeongbuk_gyeongju", icon: "gyeongbuk-gyeongju", sidoName: "경상북도", sigunguName: "경주시" },
  { key: "gyeongbuk_gyeongsan", icon: "gyeongbuk-gyeongsan", sidoName: "경상북도", sigunguName: "경산시" },
  { key: "gyeongbuk_mungyeong", icon: "gyeongbuk-mungyeong", sidoName: "경상북도", sigunguName: "문경시" },
  { key: "gyeongbuk_pohang", icon: "gyeongbuk-pohang", sidoName: "경상북도", sigunguName: "포항시" },
  { key: "gyeongbuk_sangju", icon: "gyeongbuk-sangju", sidoName: "경상북도", sigunguName: "상주시" },
  { key: "gyeongbuk_seongju", icon: "gyeongbuk-seongju", sidoName: "경상북도", sigunguName: "성주군" },
  { key: "gyeongbuk_uiseong", icon: "gyeongbuk-uiseong", sidoName: "경상북도", sigunguName: "의성군" },
  { key: "gyeongbuk_uljin", icon: "gyeongbuk-uljin", sidoName: "경상북도", sigunguName: "울진군" },
  { key: "gyeongbuk_ulleung", icon: "gyeongbuk-ulleung", sidoName: "경상북도", sigunguName: "울릉군" },
  { key: "gyeongbuk_yecheon", icon: "gyeongbuk-yecheon", sidoName: "경상북도", sigunguName: "예천군" },
  { key: "gyeongbuk_yeongcheon", icon: "gyeongbuk-yeongcheon", sidoName: "경상북도", sigunguName: "영천시" },
  { key: "gyeongbuk_yeongdeok", icon: "gyeongbuk-yeongdeok", sidoName: "경상북도", sigunguName: "영덕군" },
  { key: "gyeongbuk_yeongju", icon: "gyeongbuk-yeongju", sidoName: "경상북도", sigunguName: "영주시" },
  { key: "gyeongbuk_yeongyang", icon: "gyeongbuk-yeongyang", sidoName: "경상북도", sigunguName: "영양군" },
  // 경상남도
  { key: "gyeongnam_changnyeong", icon: "gyeongnam-changnyeong", sidoName: "경상남도", sigunguName: "창녕군" },
  { key: "gyeongnam_changwon", icon: "gyeongnam-changwon", sidoName: "경상남도", sigunguName: "창원시" },
  { key: "gyeongnam_geochang", icon: "gyeongnam-geochang", sidoName: "경상남도", sigunguName: "거창군" },
  { key: "gyeongnam_geoje", icon: "gyeongnam-geoje", sidoName: "경상남도", sigunguName: "거제시" },
  { key: "gyeongnam_gimhae", icon: "gyeongnam-gimhae", sidoName: "경상남도", sigunguName: "김해시" },
  { key: "gyeongnam_goseong", icon: "gyeongnam-goseong", sidoName: "경상남도", sigunguName: "고성군" },
  { key: "gyeongnam_hadong", icon: "gyeongnam-hadong", sidoName: "경상남도", sigunguName: "하동군" },
  { key: "gyeongnam_haman", icon: "gyeongnam-haman", sidoName: "경상남도", sigunguName: "함안군" },
  { key: "gyeongnam_hamyang", icon: "gyeongnam-hamyang", sidoName: "경상남도", sigunguName: "함양군" },
  { key: "gyeongnam_hapcheon", icon: "gyeongnam-hapcheon", sidoName: "경상남도", sigunguName: "합천군" },
  { key: "gyeongnam_jinju", icon: "gyeongnam-jinju", sidoName: "경상남도", sigunguName: "진주시" },
  { key: "gyeongnam_miryang", icon: "gyeongnam-miryang", sidoName: "경상남도", sigunguName: "밀양시" },
  { key: "gyeongnam_namhae", icon: "gyeongnam-namhae", sidoName: "경상남도", sigunguName: "남해군" },
  { key: "gyeongnam_sacheon", icon: "gyeongnam-sacheon", sidoName: "경상남도", sigunguName: "사천시" },
  { key: "gyeongnam_sancheong", icon: "gyeongnam-sancheong", sidoName: "경상남도", sigunguName: "산청군" },
  { key: "gyeongnam_tongyeong", icon: "gyeongnam-tongyeong", sidoName: "경상남도", sigunguName: "통영시" },
  { key: "gyeongnam_uiryeong", icon: "gyeongnam-uiryeong", sidoName: "경상남도", sigunguName: "의령군" },
  { key: "gyeongnam_yangsan", icon: "gyeongnam-yangsan", sidoName: "경상남도", sigunguName: "양산시" },
  // 인천광역시
  { key: "incheon_ganghwa", icon: "incheon-ganghwa", sidoName: "인천광역시", sigunguName: "강화군" },
  { key: "incheon_ongjin", icon: "incheon-ongjin", sidoName: "인천광역시", sigunguName: "옹진군" },
  // 제주특별자치도
  { key: "jeju_jeju", icon: "jeju-jeju", sidoName: "제주특별자치도", sigunguName: "제주시" },
  { key: "jeju_seogwipo", icon: "jeju-seogwipo", sidoName: "제주특별자치도", sigunguName: "서귀포시" },
  // 전북특별자치도
  { key: "jeonbuk_buan", icon: "jeonbuk-buan", sidoName: "전북특별자치도", sigunguName: "부안군" },
  { key: "jeonbuk_gimje", icon: "jeonbuk-gimje", sidoName: "전북특별자치도", sigunguName: "김제시" },
  { key: "jeonbuk_gochang", icon: "jeonbuk-gochang", sidoName: "전북특별자치도", sigunguName: "고창군" },
  { key: "jeonbuk_gunsan", icon: "jeonbuk-gunsan", sidoName: "전북특별자치도", sigunguName: "군산시" },
  { key: "jeonbuk_iksan", icon: "jeonbuk-iksan", sidoName: "전북특별자치도", sigunguName: "익산시" },
  { key: "jeonbuk_imsil", icon: "jeonbuk-imsil", sidoName: "전북특별자치도", sigunguName: "임실군" },
  { key: "jeonbuk_jangsu", icon: "jeonbuk-jangsu", sidoName: "전북특별자치도", sigunguName: "장수군" },
  { key: "jeonbuk_jeongeup", icon: "jeonbuk-jeongeup", sidoName: "전북특별자치도", sigunguName: "정읍시" },
  { key: "jeonbuk_jeonju", icon: "jeonbuk-jeonju", sidoName: "전북특별자치도", sigunguName: "전주시" },
  { key: "jeonbuk_jinan", icon: "jeonbuk-jinan", sidoName: "전북특별자치도", sigunguName: "진안군" },
  { key: "jeonbuk_muju", icon: "jeonbuk-muju", sidoName: "전북특별자치도", sigunguName: "무주군" },
  { key: "jeonbuk_namwon", icon: "jeonbuk-namwon", sidoName: "전북특별자치도", sigunguName: "남원시" },
  { key: "jeonbuk_sunchang", icon: "jeonbuk-sunchang", sidoName: "전북특별자치도", sigunguName: "순창군" },
  { key: "jeonbuk_wanju", icon: "jeonbuk-wanju", sidoName: "전북특별자치도", sigunguName: "완주군" },
  // 전라남도
  { key: "jeonnam_boseong", icon: "jeonnam-boseong", sidoName: "전라남도", sigunguName: "보성군" },
  { key: "jeonnam_damyang", icon: "jeonnam-damyang", sidoName: "전라남도", sigunguName: "담양군" },
  { key: "jeonnam_gangjin", icon: "jeonnam-gangjin", sidoName: "전라남도", sigunguName: "강진군" },
  { key: "jeonnam_goheung", icon: "jeonnam-goheung", sidoName: "전라남도", sigunguName: "고흥군" },
  { key: "jeonnam_gokseong", icon: "jeonnam-gokseong", sidoName: "전라남도", sigunguName: "곡성군" },
  { key: "jeonnam_gurye", icon: "jeonnam-gurye", sidoName: "전라남도", sigunguName: "구례군" },
  { key: "jeonnam_gwangyang", icon: "jeonnam-gwangyang", sidoName: "전라남도", sigunguName: "광양시" },
  { key: "jeonnam_haenam", icon: "jeonnam-haenam", sidoName: "전라남도", sigunguName: "해남군" },
  { key: "jeonnam_hampyeong", icon: "jeonnam-hampyeong", sidoName: "전라남도", sigunguName: "함평군" },
  { key: "jeonnam_hwasun", icon: "jeonnam-hwasun", sidoName: "전라남도", sigunguName: "화순군" },
  { key: "jeonnam_jangheung", icon: "jeonnam-jangheung", sidoName: "전라남도", sigunguName: "장흥군" },
  { key: "jeonnam_jangseong", icon: "jeonnam-jangseong", sidoName: "전라남도", sigunguName: "장성군" },
  { key: "jeonnam_jindo", icon: "jeonnam-jindo", sidoName: "전라남도", sigunguName: "진도군" },
  { key: "jeonnam_mokpo", icon: "jeonnam-mokpo", sidoName: "전라남도", sigunguName: "목포시" },
  { key: "jeonnam_muan", icon: "jeonnam-muan", sidoName: "전라남도", sigunguName: "무안군" },
  { key: "jeonnam_naju", icon: "jeonnam-naju", sidoName: "전라남도", sigunguName: "나주시" },
  { key: "jeonnam_sinan", icon: "jeonnam-sinan", sidoName: "전라남도", sigunguName: "신안군" },
  { key: "jeonnam_suncheon", icon: "jeonnam-suncheon", sidoName: "전라남도", sigunguName: "순천시" },
  { key: "jeonnam_wando", icon: "jeonnam-wando", sidoName: "전라남도", sigunguName: "완도군" },
  { key: "jeonnam_yeongam", icon: "jeonnam-yeongam", sidoName: "전라남도", sigunguName: "영암군" },
  { key: "jeonnam_yeonggwang", icon: "jeonnam-yeonggwang", sidoName: "전라남도", sigunguName: "영광군" },
  { key: "jeonnam_yeosu", icon: "jeonnam-yeosu", sidoName: "전라남도", sigunguName: "여수시" },
  // 광역시·특별자치시 소속 시·군
  { key: "busan_gijang", icon: "busan-gijang", sidoName: "부산광역시", sigunguName: "기장군" },
  { key: "daegu_dalseong", icon: "daegu-dalseong", sidoName: "대구광역시", sigunguName: "달성군" },
  { key: "ulsan_ulju", icon: "ulsan-ulju", sidoName: "울산광역시", sigunguName: "울주군" },
  { key: "sejong_sejong", icon: "sejong-sejong", sidoName: "세종특별자치시", sigunguName: "세종시" },
];

/** 시·도명 → 수집판 표시용 짧은 이름 (예: "강원특별자치도" → "강원") */
const SHORT_SIDO: Record<string, string> = {
  강원특별자치도: "강원",
  경기도: "경기",
  충청북도: "충북",
  충청남도: "충남",
  경상북도: "경북",
  경상남도: "경남",
  전북특별자치도: "전북",
  전라남도: "전남",
  인천광역시: "인천",
  제주특별자치도: "제주",
  부산광역시: "부산",
  대구광역시: "대구",
  울산광역시: "울산",
  세종특별자치시: "세종",
};

async function main() {
  console.log("🌱 큐레이션 태그 & 뱃지 시딩 시작...\n");

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { label: tag.label },
      update: { emoji: tag.emoji },
      create: tag,
    });
  }

  // 스페셜 퀘스트(실제 축제 기반 시즌 한정 뱃지) - 지역에 연결해서 등록
  let seasonalQuestCount = 0;
  for (const quest of seasonalQuests) {
    const region = await prisma.region.findFirst({
      where: { sidoName: quest.sidoName, sigunguName: quest.sigunguName },
    });
    if (!region) {
      console.warn(
        `  ⚠️  "${quest.sidoName} ${quest.sigunguName}" 지역이 없어 "${quest.name}" 퀘스트를 건너뜁니다. (npm run seed 먼저 실행)`
      );
      continue;
    }

    const data = {
      key: quest.key,
      name: quest.name,
      description: quest.description,
      icon: quest.icon,
      type: "SEASONAL",
      startAt: quest.startAt,
      endAt: quest.endAt,
      regionId: region.id,
    };
    await prisma.badge.upsert({
      where: { key: quest.key },
      update: data,
      create: data,
    });
    seasonalQuestCount += 1;
  }

  // 초기 개발용 샘플 시즌 뱃지 정리 (실제 축제 기반 스페셜 퀘스트로 대체됨)
  // 이미 획득한 유저가 있으면 여권 기록이 사라지므로 지우지 않고 경고만 남긴다.
  const legacySeasonalKeys = [
    "jinhae_2026_spring",
    "autumn_secret_fishing_spot",
    "summer_2026_night_market",
    "summer_2026_watermelon_beach",
  ];
  for (const key of legacySeasonalKeys) {
    const legacy = await prisma.badge.findUnique({
      where: { key },
      include: { _count: { select: { userBadges: true } } },
    });
    if (!legacy) continue;

    if (legacy._count.userBadges > 0) {
      console.warn(
        `  ⚠️  샘플 뱃지 "${legacy.name}"은 이미 ${legacy._count.userBadges}명이 획득해 삭제하지 않았습니다. 수동으로 확인해주세요.`
      );
      continue;
    }
    await prisma.badge.delete({ where: { key } });
    console.log(`  🧹 샘플 시즌 뱃지 삭제: ${legacy.name}`);
  }

  // 예전 랜드마크식 key로 만들어졌던 지역 뱃지 정리 (기초자치단체 뱃지로 재정의)
  await prisma.badge.deleteMany({
    where: {
      key: {
        in: [
          "gangwon_donghae_lighthouse",
          "gangwon_yanggu_punchbowl",
          "gangwon_goseong_observatory",
          "gangwon_yeongwol_donggang",
          "gangwon_samcheok_cave",
          "gangwon_inje_birch_forest",
          "gangwon_yangyang_surfbeach",
        ],
      },
    },
  });

  let regionBadgeCount = 0;
  for (const badge of regionBadges) {
    const region = await prisma.region.findFirst({
      where: { sidoName: badge.sidoName, sigunguName: badge.sigunguName },
    });
    if (!region) {
      console.warn(`  ⚠️  "${badge.sidoName} ${badge.sigunguName}" 지역이 없어 건너뜁니다. (npm run seed 먼저 실행)`);
      continue;
    }

    const shortSido = SHORT_SIDO[badge.sidoName] ?? badge.sidoName;
    const data = {
      key: badge.key,
      name: `${shortSido} ${badge.sigunguName}`,
      description: `${badge.sidoName} ${badge.sigunguName} 기초자치단체 뱃지`,
      icon: `badges/${badge.icon}.png`,
      type: "REGION",
      regionId: region.id,
    };
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: data,
      create: data,
    });
    regionBadgeCount += 1;
  }

  console.log(
    `✅ 시딩 완료! 태그 ${tags.length}개, 스페셜 퀘스트 ${seasonalQuestCount}개, 지역 뱃지 ${regionBadgeCount}개`
  );
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
