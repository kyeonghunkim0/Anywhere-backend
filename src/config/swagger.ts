import { type JsonObject } from "swagger-ui-express";

export const swaggerDocument: JsonObject = {
  openapi: "3.0.3",
  info: {
    title: "아무데나 (Anywhere) API",
    description:
      "전국 228개 지역을 여행하며 도장을 수집하는 '아무데나' 서비스의 백엔드 API입니다.\n\n" +
      "### 인증 방식\n" +
      "소셜 로그인 후 발급받은 JWT 토큰을 `Authorization: Bearer <token>` 헤더에 포함하여 요청합니다.\n\n" +
      "### 공통 에러 규약\n" +
      "성공·실패 모두 `{ success, ... }` 형태의 JSON으로 응답합니다. 실패 응답의 본문은 항상 " +
      "`{ \"success\": false, \"code\": \"...\", \"message\": \"...\" }` 입니다. `code`는 기계용 메시지 키, " +
      "`message`는 요청 `Accept-Language` 헤더에 맞춰 번역된 문구입니다.\n\n" +
      "지원 로케일: `ko`(기본) · `en` · `ja` · `zh`. 헤더가 없거나 미지원이면 한국어로 응답합니다.\n\n" +
      "| 상태 | 의미 |\n" +
      "| --- | --- |\n" +
      "| 400 | 필수 파라미터 누락 · 잘못된 입력 · 본문 JSON 파싱 실패 |\n" +
      "| 401 | 토큰 없음 · 만료 · 무효 (소셜 idToken 검증 실패 포함) |\n" +
      "| 404 | 리소스 없음 · 존재하지 않는 경로 |\n" +
      "| 409 | 중복 데이터 (unique 제약 위반) |\n" +
      "| 429 | 요청 횟수 제한 초과 (매칭 일 20회) |\n" +
      "| 500 | 그 외 서버 오류. `code`는 항상 `common.serverError` |\n\n" +
      "등록되지 않은 경로로 요청하면 HTML이 아닌 위 형식의 404 JSON이 반환됩니다. " +
      "각 엔드포인트에 개별 명시되지 않은 400/500 응답도 동일한 규약을 따릅니다.\n\n" +
      "### 주요 기능\n" +
      "- 🔐 Apple / Google 소셜 로그인\n" +
      "- 🎯 인구감소지역 가중치 기반 랜덤 관광지 매칭 (일 20회 제한)\n" +
      "- 📍 GPS 기반 반경 500m 체크인 (인구감소지역 보상 2배)\n" +
      "- 📘 228개 지역 여권(도장) 수집 현황\n" +
      "- 🏆 유저 / 인기 지역 랭킹 + 내 랭킹 조회\n" +
      "- 📢 실시간 활동 피드\n" +
      "- 🏷️ 홈 화면 큐레이션 해시태그\n" +
      "- 🎖️ 스페셜(시즌 한정) & 로컬 히든 뱃지\n" +
      "- 🌱 지역 로컬 성장 게이지 (레벨업)\n" +
      "- 👤 유저 프로필 / 설정 / 랭커 상세",
    version: "1.2.0",
    contact: {
      name: "Anywhere Team",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "로컬 개발 서버",
    },
  ],
  tags: [
    { name: "Auth", description: "인증 (소셜 로그인)" },
    { name: "Match", description: "랜덤 관광지 매칭" },
    { name: "Mission", description: "방문 인증 (체크인)" },
    { name: "Passport", description: "여권 (도장 수집 현황)" },
    { name: "Ranking", description: "랭킹" },
    { name: "Feed", description: "실시간 활동 피드" },
    { name: "Tags", description: "홈 화면 큐레이션 해시태그" },
    { name: "Places", description: "장소 상세 (이름·주소·좌표·지역·태그·후기)" },
    { name: "Search", description: "지역 + 관광지 통합 검색" },
    { name: "Badges", description: "스페셜(시즌 한정) & 로컬 히든 뱃지" },
    { name: "Regions", description: "지역 로컬 성장 게이지" },
    { name: "Users", description: "유저 프로필 / 설정 / 랭커 상세" },
    { name: "App", description: "앱 정보 (버전 / 점검 상태)" },
    { name: "Home", description: "홈 화면 진입용 통합 조회" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "소셜 로그인 후 발급받은 JWT 토큰",
      },
      AdminKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-admin-key",
        description: "관리자 전용 API 인증키 (ADMIN_API_KEY 환경변수)",
      },
    },
    // 모든 엔드포인트가 공유하는 실패 응답 (본문 형태는 Error 스키마로 동일)
    responses: {
      BadRequest: {
        description: "필수 파라미터 누락 · 잘못된 입력 · 본문 JSON 파싱 실패",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, code: "validation.userIdRequired", message: "userId는 필수입니다." },
          },
        },
      },
      Unauthorized: {
        description: "토큰 없음 · 만료 · 무효",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, code: "auth.tokenInvalid", message: "유효하지 않은 토큰입니다." },
          },
        },
      },
      NotFound: {
        description: "리소스 없음 · 존재하지 않는 경로",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, code: "region.notFound", message: "존재하지 않는 지역입니다." },
          },
        },
      },
      Conflict: {
        description: "중복 데이터 (unique 제약 위반)",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, code: "common.duplicate", message: "이미 존재하는 데이터입니다." },
          },
        },
      },
      ServerError: {
        description: "서버 오류",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, code: "common.serverError", message: "서버 오류가 발생했습니다." },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          code: {
            type: "string",
            description: "기계용 메시지 키 (i18n)",
            example: "validation.userIdRequired",
          },
          message: {
            type: "string",
            description: "Accept-Language에 맞춰 번역된 문구",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123abc" },
          nickname: { type: "string", example: "여행자" },
          socialType: { type: "string", enum: ["apple", "google", "guest"] },
          totalStamps: { type: "integer", example: 5 },
          isGuest: { type: "boolean", example: false },
          guestExpiresAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "게스트 계정 만료 시각 (isGuest가 true일 때만 값이 있음)",
          },
        },
      },
      Place: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "경복궁" },
          address: { type: "string", example: "서울특별시 종로구 사직로 161" },
          thumbnail: { type: "string", nullable: true },
          mapX: { type: "number", example: 126.977 },
          mapY: { type: "number", example: 37.579 },
          distanceKm: { type: "number", example: 3.2 },
          latestReview: {
            type: "object",
            nullable: true,
            description: "이 장소에 달린 가장 최신 후기 (없으면 null)",
            properties: {
              content: { type: "string", example: "저녁에 산책하기 정말 좋아요." },
              nickname: { type: "string", example: "여행자" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      Region: {
        type: "object",
        properties: {
          id: { type: "string" },
          sidoName: { type: "string", example: "서울특별시" },
          sigunguName: { type: "string", example: "종로구" },
          displayName: { type: "string", example: "서울 종로구" },
          isDepopulated: { type: "boolean", example: false },
          imageUrl: {
            type: "string",
            nullable: true,
            example: "https://tong.visitkorea.or.kr/cms2/website/52/2586952.jpg",
            description: "지역 대표 사진 (한국관광공사 관광사진갤러리)",
          },
        },
      },
      MatchInfo: {
        type: "object",
        properties: {
          remainingMatches: {
            type: "integer",
            example: 2,
            description: "오늘 남은 매칭 횟수",
          },
          isDepopulatedBonus: {
            type: "boolean",
            example: true,
            description: "인구감소지역 골드 배지 여부",
          },
        },
      },
      StampResult: {
        type: "object",
        properties: {
          id: { type: "string" },
          placeName: { type: "string" },
          regionName: { type: "string" },
          isDepopulated: { type: "boolean" },
          bonusMultiplier: {
            type: "integer",
            example: 2,
            description: "보상 배수 (1=일반, 2=인구감소지역)",
          },
          stampsEarned: {
            type: "integer",
            example: 2,
            description: "이번에 획득한 도장 수",
          },
          checkedInAt: { type: "string", format: "date-time" },
          totalStamps: { type: "integer" },
        },
      },
      FeedItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          nickname: { type: "string", example: "여행자" },
          sidoName: { type: "string", example: "전라남도" },
          sigunguName: { type: "string", example: "신안군" },
          displayName: { type: "string", example: "전남 신안군" },
          placeName: { type: "string", example: "증도 태평염전" },
          isDepopulated: { type: "boolean", example: true },
          checkedInAt: { type: "string", format: "date-time" },
          message: {
            type: "string",
            example: "🌟 여행자님이 전라남도 신안군 도장을 획득했습니다!",
          },
        },
      },
      MyRank: {
        type: "object",
        properties: {
          rank: { type: "integer", example: 42 },
          totalUsers: { type: "integer", example: 1000 },
          userId: { type: "string" },
          nickname: { type: "string" },
          totalStamps: { type: "integer" },
          topPercentage: {
            type: "number",
            example: 4.2,
            description: "상위 N%",
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "소셜 로그인",
        description:
          "Apple 또는 Google 소셜 로그인을 처리합니다. 신규 유저는 자동 회원가입되며 JWT 토큰이 발급됩니다. " +
          "서버가 각 프로바이더의 공개키로 idToken을 검증해서 socialId(sub)를 직접 뽑아내며, 클라이언트가 보낸 socialId는 신뢰하지 않습니다.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["socialType", "idToken"],
                properties: {
                  socialType: {
                    type: "string",
                    enum: ["apple", "google"],
                    description: "소셜 로그인 유형",
                  },
                  idToken: {
                    type: "string",
                    description:
                      "google: GIDGoogleUser.idToken.tokenString / apple: ASAuthorizationAppleIDCredential.identityToken",
                  },
                  nickname: {
                    type: "string",
                    description: "(선택) 닉네임. 미입력 시 자동 생성",
                    example: "여행자",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "기존 유저 로그인 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "로그인 성공" },
                    data: {
                      type: "object",
                      properties: {
                        token: { type: "string", description: "JWT 토큰" },
                        user: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
            },
          },
          "201": { description: "신규 유저 회원가입 완료" },
          "400": {
            description:
              "필수 파라미터 누락 (socialType / idToken) 또는 socialType이 apple·google이 아님",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "idToken은 필수입니다." },
              },
            },
          },
          "401": {
            description:
              "idToken 검증 실패. 서명·발급자(issuer)·대상(audience, 앱 Bundle ID/Client ID) 불일치 또는 만료된 토큰입니다.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "idToken 검증에 실패했습니다." },
              },
            },
          },
          "500": {
            description:
              "서버 오류. 프로바이더 공개키(JWKS) 조회 실패 등 토큰 자체와 무관한 실패도 여기에 포함됩니다.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "서버 오류가 발생했습니다." },
              },
            },
          },
        },
      },
    },
    "/api/auth/guest": {
      post: {
        tags: ["Auth"],
        summary: "게스트(비회원) 로그인",
        description:
          "deviceId 기준으로 게스트 계정에 로그인합니다. 신규 deviceId는 자동으로 게스트 계정이 생성되며, " +
          "로그인할 때마다 만료 시각이 GUEST_EXPIRES_IN_HOURS(기본 24시간)만큼 연장됩니다. " +
          "만료된 게스트 계정은 배치로 자동 삭제됩니다.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["deviceId"],
                properties: {
                  deviceId: {
                    type: "string",
                    description: "클라이언트가 생성해 보관하는 디바이스 UUID",
                    example: "550e8400-e29b-41d4-a716-446655440000",
                  },
                  nickname: {
                    type: "string",
                    description: "(선택) 닉네임. 미입력 시 자동 생성",
                    example: "게스트",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "기존 게스트 재로그인 성공(만료 시각 연장)" },
          "201": { description: "신규 게스트 계정 생성 완료" },
          "400": {
            description: "deviceId 누락",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "deviceId는 필수입니다." },
              },
            },
          },
          "409": {
            description: "이미 정회원으로 전환된 deviceId",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "이미 정회원으로 전환된 deviceId입니다." },
              },
            },
          },
        },
      },
    },
    "/api/auth/guest/upgrade": {
      post: {
        tags: ["Auth"],
        summary: "게스트 계정을 정회원으로 전환",
        description:
          "게스트 계정으로 로그인한 상태에서 Apple/Google 소셜 로그인을 연결해 같은 계정을 정회원으로 전환합니다. " +
          "스탬프·매칭이력 등 기존 데이터는 그대로 유지됩니다.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["socialType", "idToken"],
                properties: {
                  socialType: { type: "string", enum: ["apple", "google"] },
                  idToken: { type: "string" },
                  nickname: { type: "string", description: "(선택) 닉네임 변경" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "정회원 전환 완료" },
          "400": {
            description: "게스트 계정이 아니거나 필수 파라미터 누락",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "게스트 계정이 아닙니다." },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": {
            description: "해당 소셜 계정이 이미 다른 유저에 연결되어 있음",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, message: "이미 다른 계정에 연결된 소셜 계정입니다." },
              },
            },
          },
        },
      },
    },
    "/api/match/random": {
      get: {
        tags: ["Match"],
        summary: "랜덤 관광지 매칭",
        description:
          "사용자 현재 GPS 기반으로 반경 내 관광지 중 랜덤 1곳을 반환합니다.\n\n" +
          "- 인구감소지역에 70% 가중치 적용\n" +
          "- **하루 최대 20회** 매칭 가능 (초과 시 429 응답)\n" +
          "- 이미 방문한 장소는 우선순위가 낮아집니다",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "lat",
            in: "query",
            required: true,
            schema: { type: "number", example: 37.5665 },
            description: "현재 위도",
          },
          {
            name: "lng",
            in: "query",
            required: true,
            schema: { type: "number", example: 126.978 },
            description: "현재 경도",
          },
          {
            name: "radiusKm",
            in: "query",
            required: false,
            schema: { type: "number", default: 50 },
            description: "탐색 반경 (km, 기본값: 50)",
          },
        ],
        responses: {
          "200": {
            description: "매칭 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        matchId: {
                          type: "string",
                          description: "이 매칭을 확정(POST /api/match/{matchId}/confirm)할 때 사용",
                        },
                        place: { $ref: "#/components/schemas/Place" },
                        region: { $ref: "#/components/schemas/Region" },
                        matchInfo: { $ref: "#/components/schemas/MatchInfo" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "인증 필요" },
          "404": { description: "주변에 매칭 가능한 관광지 없음" },
          "429": {
            description: "일일 매칭 횟수 초과 (20회)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/match/custom": {
      post: {
        tags: ["Match"],
        summary: "내 맘대로 떠나기 (직접 고른 관광지로 매칭 생성)",
        description:
          "랜덤 매칭(GET /api/match/random)을 거치지 않고, 유저가 검색·태그·카탈로그 등에서 직접 고른 " +
          "관광지로 매칭 이력을 생성합니다. 응답 형태는 랜덤 매칭과 동일하며, " +
          "반환된 matchId를 그대로 POST /api/match/{matchId}/confirm에 넘겨 여정을 확정합니다.\n\n" +
          "- 하루 매칭 횟수 제한(20회)을 랜덤 매칭과 공유합니다\n" +
          "- distanceKm는 요청한 lat/lng와 관광지 좌표 사이 직선 거리를 서버가 계산합니다",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["placeId", "lat", "lng"],
                properties: {
                  placeId: { type: "string", description: "유저가 직접 고른 관광지 ID" },
                  lat: { type: "number", example: 37.5665, description: "현재 위도" },
                  lng: { type: "number", example: 126.978, description: "현재 경도" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "매칭 생성 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        matchId: {
                          type: "string",
                          description: "이 매칭을 확정(POST /api/match/{matchId}/confirm)할 때 사용",
                        },
                        place: { $ref: "#/components/schemas/Place" },
                        region: { $ref: "#/components/schemas/Region" },
                        matchInfo: { $ref: "#/components/schemas/MatchInfo" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "placeId 누락 또는 lat/lng 누락·유효하지 않음" },
          "401": { description: "인증 필요" },
          "404": { description: "존재하지 않는 관광지" },
          "429": {
            description: "일일 매칭 횟수 초과 (20회)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/match/current": {
      get: {
        tags: ["Match"],
        summary: "진행 중인 여정 조회",
        description:
          "홈 화면 [이동 중] 카드용. 확정됐지만 아직 체크인하지 않은 여정을 반환합니다. 없으면 data: null.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "조회 성공 (여정 없으면 data: null)" },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/match/{matchId}/confirm": {
      post: {
        tags: ["Match"],
        summary: "여정 확정 (\"여기로 결정\")",
        description:
          "매칭 후보를 진행 중인 여정으로 확정합니다. 기존에 확정된 다른 여정이 있으면 자동으로 취소됩니다.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "matchId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "확정 성공" },
          "400": { description: "이미 취소되었거나 체크인 완료된 매칭" },
          "401": { description: "인증 필요" },
          "404": { description: "존재하지 않는 매칭" },
        },
      },
    },
    "/api/match/{matchId}/cancel": {
      post: {
        tags: ["Match"],
        summary: "여정 취소",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "matchId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "취소 성공" },
          "400": { description: "이미 체크인이 완료되어 취소할 수 없음" },
          "401": { description: "인증 필요" },
          "404": { description: "존재하지 않는 매칭" },
        },
      },
    },
    "/api/mission/check-in": {
      post: {
        tags: ["Mission"],
        summary: "방문 인증 (체크인)",
        description:
          "클라이언트의 현재 GPS와 목적지 좌표를 비교하여 반경 500m 이내일 경우 도장을 부여합니다.\n\n" +
          "- 같은 장소에 하루 1회만 체크인 가능\n" +
          "- **인구감소지역은 보상 2배** (도장 2개 획득)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["placeId", "lat", "lng"],
                properties: {
                  placeId: {
                    type: "string",
                    description: "체크인할 관광지 ID",
                  },
                  lat: {
                    type: "number",
                    description: "현재 위도",
                    example: 37.5796,
                  },
                  lng: {
                    type: "number",
                    description: "현재 경도",
                    example: 126.977,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "체크인 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example:
                        "🎉 경복궁 방문 인증 완료! 🌟 로컬 상생 지역 보너스! 도장 2개 획득!",
                    },
                    stamp: { $ref: "#/components/schemas/StampResult" },
                  },
                },
              },
            },
          },
          "400": { description: "반경 초과 / 중복 체크인 / 파라미터 누락" },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/passport/{userId}": {
      get: {
        tags: ["Passport"],
        summary: "여권 조회 (도장 수집 현황)",
        description:
          "해당 사용자가 수집한 시·군 단위 지역(특별·광역시 자치구 제외) 매핑 데이터를 반환합니다.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "조회할 사용자 ID",
          },
        ],
        responses: {
          "200": {
            description: "여권 조회 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        userId: { type: "string" },
                        nickname: { type: "string" },
                        totalStamps: { type: "integer" },
                        totalRegions: { type: "integer", example: 160 },
                        visitedRegions: { type: "integer", example: 15 },
                        completionRate: { type: "number", example: 6.6 },
                        regions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              regionId: { type: "string" },
                              sidoName: { type: "string" },
                              sigunguName: { type: "string" },
                              displayName: { type: "string", example: "부산 중구" },
                              isDepopulated: { type: "boolean" },
                              isVisited: { type: "boolean" },
                              visitCount: { type: "integer" },
                              lastVisitedAt: {
                                type: "string",
                                format: "date-time",
                                nullable: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/ranking/users": {
      get: {
        tags: ["Ranking"],
        summary: "유저 랭킹 TOP 10",
        description:
          "전체 사용자 도장 개수 기준 실시간 상위 TOP 10 유저를 반환합니다.",
        responses: {
          "200": {
            description: "랭킹 조회 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          rank: { type: "integer", example: 1 },
                          userId: { type: "string" },
                          nickname: { type: "string" },
                          totalStamps: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ranking/places": {
      get: {
        tags: ["Ranking"],
        summary: "인기 지역 TOP 10",
        description:
          "최근 1주일간 가장 많이 체크인된 지역 TOP 10을 반환합니다. 숨겨진 지역이 랭킹에 올라가는 트렌드를 시각화합니다.",
        responses: {
          "200": {
            description: "랭킹 조회 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          rank: { type: "integer", example: 1 },
                          regionId: { type: "string" },
                          sidoName: { type: "string" },
                          sigunguName: { type: "string" },
                          displayName: { type: "string", example: "부산 중구" },
                          isDepopulated: { type: "boolean" },
                          visitCount: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ranking/me": {
      get: {
        tags: ["Ranking"],
        summary: "내 랭킹 조회",
        description:
          "현재 로그인한 사용자의 전체 유저 중 순위를 조회합니다. TOP 10 밖이어도 정확한 순위와 상위 N% 정보를 제공합니다.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "내 랭킹 조회 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/MyRank" },
                  },
                },
              },
            },
          },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/feed/recent": {
      get: {
        tags: ["Feed"],
        summary: "실시간 활동 피드",
        description:
          "전체 유저의 최근 체크인 활동 내역을 조회합니다. 홈 화면 상단 실시간 알림 티커에 사용됩니다.\n\n" +
          "인증 없이 조회 가능합니다.",
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, minimum: 1, maximum: 50 },
            description: "조회할 피드 개수 (기본값: 20, 최대: 50)",
          },
        ],
        responses: {
          "200": {
            description: "피드 조회 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        items: {
                          type: "array",
                          items: { $ref: "#/components/schemas/FeedItem" },
                        },
                        totalCount: { type: "integer", example: 150 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/tags": {
      get: {
        tags: ["Tags"],
        summary: "큐레이션 해시태그 목록",
        description: "홈 화면 상단에 노출되는 감성 해시태그 칩 목록입니다 (예: #밤하늘_별맛집).",
        responses: {
          "200": { description: "조회 성공" },
        },
      },
    },
    "/api/tags/{tagId}/places": {
      get: {
        tags: ["Tags"],
        summary: "해시태그별 관광지 목록",
        description:
          "각 관광지의 좌표(mapX/mapY)를 포함합니다. lat/lng를 함께 넘기면 관광지별 distanceKm(km, 소수 1자리)를 서버가 계산해 실어 줍니다.",
        parameters: [
          { name: "tagId", in: "path", required: true, schema: { type: "string" } },
          { name: "lat", in: "query", required: false, schema: { type: "number" }, description: "사용자 위도 (lng와 함께)" },
          { name: "lng", in: "query", required: false, schema: { type: "number" }, description: "사용자 경도 (lat와 함께)" },
        ],
        responses: {
          "200": { description: "조회 성공" },
          "400": { description: "lat/lng 중 하나만 넘겼거나 좌표 범위 초과" },
        },
      },
      post: {
        tags: ["Tags"],
        summary: "(관리자) 태그-관광지 연결 추가",
        description:
          "큐레이션 태그는 관광지 데이터만으로 자동 판별할 수 없어 운영자가 수동으로 실제 관광지를 골라 태그에 연결합니다.",
        security: [{ AdminKeyAuth: [] }],
        parameters: [{ name: "tagId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["placeId"],
                properties: { placeId: { type: "string", description: "태그를 붙일 관광지 ID" } },
              },
            },
          },
        },
        responses: {
          "201": { description: "연결 완료" },
          "400": { description: "placeId 누락" },
          "401": {
            description: "관리자 인증 실패 (x-admin-key 헤더 없음 또는 불일치)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, code: "admin.unauthorized", message: "관리자 인증에 실패했습니다." },
              },
            },
          },
          "404": { description: "존재하지 않는 태그 또는 관광지" },
          "409": { description: "이미 연결된 태그-관광지 조합" },
        },
      },
    },
    "/api/tags/{tagId}/places/{placeId}": {
      delete: {
        tags: ["Tags"],
        summary: "(관리자) 태그-관광지 연결 해제",
        security: [{ AdminKeyAuth: [] }],
        parameters: [
          { name: "tagId", in: "path", required: true, schema: { type: "string" } },
          { name: "placeId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "연결 해제 완료" },
          "401": {
            description: "관리자 인증 실패",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { success: false, code: "admin.unauthorized", message: "관리자 인증에 실패했습니다." },
              },
            },
          },
          "404": { description: "연결되어 있지 않은 태그-관광지 조합" },
        },
      },
    },
    "/api/places": {
      get: {
        tags: ["Places"],
        summary: "장소 카탈로그 (검색어 없을 때의 추천 목록)",
        description:
          "검색·발견 대상 장소 목록입니다. 특별·광역시 자치구는 제외(시·군 단위만), " +
          "인구감소지역 → 도장 수 → 이름 순으로 정렬합니다. " +
          "depopulated=true면 인구감소지역만, regionGroup으로 권역 필터, " +
          "lat/lng를 함께 넘기면 장소별 distanceKm를 서버가 계산합니다. " +
          "각 장소의 region.activeFestivals에는 지금 그 지역에서 진행 중인 스페셜 퀘스트(축제) 뱃지가 담깁니다. (인증 불필요)",
        parameters: [
          { name: "depopulated", in: "query", required: false, schema: { type: "boolean" }, description: "true면 인구감소지역만" },
          {
            name: "regionGroup",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["수도권", "충청", "전라", "경상", "강원", "제주"] },
            description: "권역 칩 필터. 생략 또는 '전지역'이면 전체",
          },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20, minimum: 1, maximum: 50 } },
          { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0, minimum: 0 } },
          { name: "lat", in: "query", required: false, schema: { type: "number" }, description: "사용자 위도 (lng와 함께)" },
          { name: "lng", in: "query", required: false, schema: { type: "number" }, description: "사용자 경도 (lat와 함께)" },
        ],
        responses: {
          "200": { description: "조회 성공" },
          "400": { description: "잘못된 limit/offset·regionGroup·좌표" },
        },
      },
    },
    "/api/places/{placeId}": {
      get: {
        tags: ["Places"],
        summary: "장소 상세",
        description:
          "placeId 단건으로 장소 상세를 조회합니다. 이름·주소·좌표(mapX/mapY)·지역(displayName)·태그·방문자 수와 최신 후기(reviews)를 한 번에 반환합니다. " +
          "region.activeFestivals에는 지금 그 지역에서 진행 중인 스페셜 퀘스트(축제) 뱃지가 담깁니다.",
        parameters: [
          { name: "placeId", in: "path", required: true, schema: { type: "string" } },
          { name: "reviewLimit", in: "query", required: false, schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "조회 성공" },
          "404": { description: "존재하지 않는 관광지" },
        },
      },
    },
    "/api/badges/me": {
      get: {
        tags: ["Badges"],
        summary: "내 뱃지 현황",
        description:
          "스페셜(시즌 한정) & 로컬 히든 뱃지 전체 현황을 조회합니다.\n\n" +
          "- 미획득 히든 뱃지는 좌표가 노출되지 않습니다 (수집 재미 보호)\n" +
          "- 시즌 한정 뱃지는 마감까지 남은 일수(daysRemaining, D-day)를 포함합니다",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "조회 성공" },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/badges/seasonal": {
      get: {
        tags: ["Badges"],
        summary: "진행 중인 시즌 한정 뱃지",
        description: "홈 화면 [스페셜 퀘스트] 캐러셀에 노출되는 활성 시즌 한정 뱃지 목록입니다.",
        responses: {
          "200": { description: "조회 성공" },
        },
      },
    },
    "/api/home": {
      get: {
        tags: ["Home"],
        summary: "홈 화면 통합 조회",
        description:
          "홈 진입 시 필요한 데이터를 한 번에 반환합니다 (currentTrip · seasonalBadges · growthRegions · sectionVisibility).\n\n" +
          "- sectionVisibility.specialQuests / trendingLocal: 운영자가 수동으로 끈 섹션은 false. " +
          "false인 섹션은 데이터가 채워져 와도 클라이언트가 무조건 숨겨야 합니다 (enabled && !isEmpty로 결합).\n" +
          "- 클라이언트가 모르는 sectionVisibility 키는 무시하도록 설계되어 있어 섹션이 추가돼도 하위 호환됩니다.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "조회 성공" },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/regions/growth": {
      get: {
        tags: ["Regions"],
        summary: "레벨업 임박 로컬 리스트",
        description: "다음 레벨까지 방문이 가장 적게 남은 인구감소지역 순으로 정렬하여 반환합니다.",
        parameters: [
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": { description: "조회 성공" },
        },
      },
    },
    "/api/regions/{regionId}": {
      get: {
        tags: ["Regions"],
        summary: "지역 상세 (로컬 성장 게이지)",
        description:
          "지역 레벨, 다음 레벨까지 진행률, 방문 통계, 레벨별 보상 달성 현황과 지역 대표 사진(imageUrl · imageCredit)을 반환합니다.",
        parameters: [
          { name: "regionId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "조회 성공" },
          "404": { description: "존재하지 않는 지역" },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "내 프로필 조회",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "조회 성공" },
          "401": { description: "인증 필요" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "프로필 편집 (닉네임 / 프로필 이미지)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nickname: { type: "string", maxLength: 12 },
                  profileImage: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "저장 성공" },
          "400": { description: "닉네임 12자 초과" },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/users/me/stats": {
      get: {
        tags: ["Users"],
        summary: "프로필 화면 상세 통계",
        description:
          "수집 도시 수, 소멸지역 방문 비율, 누적 이동 거리, 최근 도장, 획득 뱃지 수, 작성 후기 수, 전국 랭킹을 반환합니다.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "조회 성공" },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/users/me/settings": {
      patch: {
        tags: ["Users"],
        summary: "설정 - 푸시 알림 on/off",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pushEnabled"],
                properties: { pushEnabled: { type: "boolean" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "저장 성공" },
          "401": { description: "인증 필요" },
        },
      },
    },
    "/api/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "로컬 후기 작성",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["placeId", "content"],
                properties: {
                  placeId: { type: "string" },
                  content: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "작성 성공" },
          "400": { description: "내용 누락 / 500자 초과" },
          "401": { description: "인증 필요" },
          "404": { description: "존재하지 않는 관광지" },
        },
      },
    },
    "/api/reviews/places/{placeId}": {
      get: {
        tags: ["Reviews"],
        summary: "특정 관광지의 후기 목록",
        parameters: [
          { name: "placeId", in: "path", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "조회 성공" },
        },
      },
    },
    "/api/app/info": {
      get: {
        tags: ["App"],
        summary: "앱 정보 조회 (버전 / 점검 상태)",
        description:
          "앱 최초 실행 시 호출하여 강제 업데이트 여부와 서비스 점검 상태를 확인합니다.\n\n" +
          "- `version` 쿼리 파라미터로 클라이언트 버전을 전달하면 `forceUpdate`(강제) / `updateAvailable`(선택) 여부를 계산합니다\n" +
          "- `platform`(ios/android)을 전달하면 해당 스토어 링크를 `storeUrl`로 내려줍니다\n" +
          "- 인증이 필요하지 않습니다",
        parameters: [
          {
            name: "version",
            in: "query",
            required: false,
            schema: { type: "string", example: "1.0.0" },
            description: "클라이언트 앱 버전",
          },
          {
            name: "platform",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["ios", "android"] },
            description: "클라이언트 플랫폼. storeUrl 결정에 사용",
          },
        ],
        responses: {
          "200": {
            description: "조회 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        appName: { type: "string", example: "아무데나" },
                        latestVersion: { type: "string", example: "1.2.0" },
                        minVersion: { type: "string", example: "1.0.0" },
                        forceUpdate: { type: "boolean", example: false },
                        updateAvailable: { type: "boolean", example: true },
                        updateMessage: { type: "string", nullable: true },
                        storeUrl: { type: "string", example: "https://apps.apple.com/us/app/어딘지/id6795130564" },
                        maintenanceMode: { type: "boolean", example: false },
                        maintenanceMessage: { type: "string", nullable: true },
                        serverTime: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/search": {
      get: {
        tags: ["Search"],
        summary: "통합 검색 (지역 + 관광지)",
        description:
          "키워드로 지역 이름과 관광지 이름·주소를 함께 검색합니다. " +
          "특별·광역시 자치구는 결과에서 제외되며(시·군 단위만), " +
          "관광지는 이름 일치 우선(정확 → 접두 → 포함 → 주소) 정렬 후 limit/offset으로 페이징합니다. " +
          "지역은 regionLimit/regionOffset으로 따로 페이징합니다. " +
          "regionGroup으로 권역(수도권·충청·전라·경상·강원·제주)을 지정하면 지역·관광지 결과에 함께 적용됩니다. " +
          "q를 생략하거나 빈 값으로 보내면 검색 대신 추천 목록(장소 카탈로그)을 places에 담아 주고 regions는 빈 페이지가 됩니다. " +
          "lat/lng를 함께 넘기면 관광지별 distanceKm를 서버가 계산합니다. " +
          "festivals에는 이름·설명에 검색어가 걸리는 스페셜 퀘스트(시즌 한정 뱃지)가 최대 20건 담기며, " +
          "진행 전/중/종료 여부를 status(UPCOMING/ACTIVE/EXPIRED)로 구분합니다. (인증 불필요)",
        parameters: [
          {
            name: "q",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "검색어 (예: 포항, 해수욕장, 강릉 카페). 생략 시 추천 목록 반환",
          },
          { name: "lat", in: "query", required: false, schema: { type: "number" }, description: "사용자 위도 (lng와 함께)" },
          { name: "lng", in: "query", required: false, schema: { type: "number" }, description: "사용자 경도 (lat와 함께)" },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, minimum: 1, maximum: 50 },
            description: "관광지 결과 개수 (1~50)",
          },
          {
            name: "offset",
            in: "query",
            required: false,
            schema: { type: "integer", default: 0, minimum: 0 },
            description: "관광지 결과 시작 위치",
          },
          {
            name: "regionLimit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, minimum: 1, maximum: 50 },
            description: "지역 결과 개수 (1~50)",
          },
          {
            name: "regionOffset",
            in: "query",
            required: false,
            schema: { type: "integer", default: 0, minimum: 0 },
            description: "지역 결과 시작 위치",
          },
          {
            name: "regionGroup",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["수도권", "충청", "전라", "경상", "강원", "제주"],
            },
            description: "권역 칩 필터. 생략 또는 '전지역'이면 전체. 지역·관광지 결과에 함께 적용",
          },
        ],
        responses: {
          "200": {
            description: "검색 성공",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        query: { type: "string", example: "포항" },
                        regions: {
                          type: "object",
                          properties: {
                            total: { type: "integer", example: 3 },
                            limit: { type: "integer", example: 20 },
                            offset: { type: "integer", example: 0 },
                            items: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  regionId: { type: "string" },
                                  sidoName: { type: "string", example: "경상북도" },
                                  sigunguName: { type: "string", example: "포항시" },
                                  displayName: { type: "string", example: "경북 포항시" },
                                  isDepopulated: { type: "boolean" },
                                  imageUrl: { type: "string", nullable: true },
                                },
                              },
                            },
                          },
                        },
                        places: {
                          type: "object",
                          properties: {
                            total: { type: "integer", example: 42 },
                            limit: { type: "integer", example: 20 },
                            offset: { type: "integer", example: 0 },
                            items: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  id: { type: "string" },
                                  name: { type: "string" },
                                  address: { type: "string" },
                                  thumbnail: { type: "string", nullable: true },
                                  mapX: { type: "number" },
                                  mapY: { type: "number" },
                                  stampCount: { type: "integer" },
                                  distanceKm: { type: "number", nullable: true, example: 3.2 },
                                  region: {
                                    type: "object",
                                    properties: {
                                      id: { type: "string" },
                                      sidoName: { type: "string" },
                                      sigunguName: { type: "string" },
                                      displayName: { type: "string" },
                                      isDepopulated: { type: "boolean" },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "검색어 누락 또는 잘못된 limit/offset" },
        },
      },
    },
    "/api/users/{userId}/detail": {
      get: {
        tags: ["Users"],
        summary: "랭커 상세 (활동 그래프 + 대표 도장)",
        description: "랭킹 리스트에서 특정 유저를 탭했을 때 노출되는 여권형 대시보드입니다.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "조회 성공" },
          "404": { description: "존재하지 않는 사용자" },
        },
      },
    },
  },
};

// ============================================
// 공통 에러 응답 자동 주입
// ============================================

interface OperationObject {
  security?: unknown[];
  responses?: Record<string, unknown>;
}

/**
 * 모든 엔드포인트에 공통 실패 응답을 채워 넣습니다.
 * - 500: 예외 없이 모든 오퍼레이션에 존재 (컨트롤러 catch 말단이 항상 500을 응답하므로)
 * - 401: security가 걸린(인증 필요) 오퍼레이션에만
 * 이미 개별 명시된 상태 코드는 덮어쓰지 않습니다.
 */
function applyCommonErrorResponses(paths: Record<string, Record<string, OperationObject>>): void {
  for (const pathItem of Object.values(paths)) {
    for (const operation of Object.values(pathItem)) {
      const responses = operation?.responses;
      if (!responses) continue;

      if (operation.security && !responses["401"]) {
        responses["401"] = { $ref: "#/components/responses/Unauthorized" };
      }
      if (!responses["500"]) {
        responses["500"] = { $ref: "#/components/responses/ServerError" };
      }
    }
  }
}

applyCommonErrorResponses(
  swaggerDocument.paths as Record<string, Record<string, OperationObject>>
);
