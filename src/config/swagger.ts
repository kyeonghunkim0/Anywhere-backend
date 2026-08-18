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
      "`{ \"success\": false, \"message\": \"...\" }` 입니다.\n\n" +
      "| 상태 | 의미 |\n" +
      "| --- | --- |\n" +
      "| 400 | 필수 파라미터 누락 · 잘못된 입력 · 본문 JSON 파싱 실패 |\n" +
      "| 401 | 토큰 없음 · 만료 · 무효 (소셜 idToken 검증 실패 포함) |\n" +
      "| 404 | 리소스 없음 · 존재하지 않는 경로 |\n" +
      "| 429 | 요청 횟수 제한 초과 (매칭 일 3회) |\n" +
      "| 500 | 그 외 서버 오류. `message`는 항상 `\"서버 오류가 발생했습니다.\"` |\n\n" +
      "등록되지 않은 경로로 요청하면 HTML이 아닌 위 형식의 404 JSON이 반환됩니다. " +
      "각 엔드포인트에 개별 명시되지 않은 400/500 응답도 동일한 규약을 따릅니다.\n\n" +
      "### 주요 기능\n" +
      "- 🔐 Apple / Google 소셜 로그인\n" +
      "- 🎯 인구감소지역 가중치 기반 랜덤 관광지 매칭 (일 3회 제한)\n" +
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
    { name: "Badges", description: "스페셜(시즌 한정) & 로컬 히든 뱃지" },
    { name: "Regions", description: "지역 로컬 성장 게이지" },
    { name: "Users", description: "유저 프로필 / 설정 / 랭커 상세" },
    { name: "App", description: "앱 정보 (버전 / 점검 상태)" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "소셜 로그인 후 발급받은 JWT 토큰",
      },
    },
    // 모든 엔드포인트가 공유하는 실패 응답 (본문 형태는 Error 스키마로 동일)
    responses: {
      BadRequest: {
        description: "필수 파라미터 누락 · 잘못된 입력 · 본문 JSON 파싱 실패",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "userId는 필수입니다." },
          },
        },
      },
      Unauthorized: {
        description: "토큰 없음 · 만료 · 무효",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "유효하지 않은 토큰입니다." },
          },
        },
      },
      NotFound: {
        description: "리소스 없음 · 존재하지 않는 경로",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "존재하지 않는 지역입니다." },
          },
        },
      },
      ServerError: {
        description: "서버 오류",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "서버 오류가 발생했습니다." },
          },
        },
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123abc" },
          nickname: { type: "string", example: "여행자" },
          socialType: { type: "string", enum: ["apple", "google"] },
          totalStamps: { type: "integer", example: 5 },
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
        },
      },
      Region: {
        type: "object",
        properties: {
          id: { type: "string" },
          sidoName: { type: "string", example: "서울특별시" },
          sigunguName: { type: "string", example: "종로구" },
          isDepopulated: { type: "boolean", example: false },
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
    "/api/match/random": {
      get: {
        tags: ["Match"],
        summary: "랜덤 관광지 매칭",
        description:
          "사용자 현재 GPS 기반으로 반경 내 관광지 중 랜덤 1곳을 반환합니다.\n\n" +
          "- 인구감소지역에 70% 가중치 적용\n" +
          "- **하루 최대 3회** 매칭 가능 (초과 시 429 응답)\n" +
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
            description: "일일 매칭 횟수 초과 (3회)",
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
        description: "해당 사용자가 수집한 228개 지역 매핑 데이터를 반환합니다.",
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
                        totalRegions: { type: "integer", example: 228 },
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
        parameters: [
          { name: "tagId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "조회 성공" },
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
        description: "지역 레벨, 다음 레벨까지 진행률, 방문 통계, 레벨별 보상 달성 현황을 반환합니다.",
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
          "- `version` 쿼리 파라미터로 클라이언트 버전을 전달하면 `forceUpdate` 여부를 계산합니다\n" +
          "- 인증이 필요하지 않습니다",
        parameters: [
          {
            name: "version",
            in: "query",
            required: false,
            schema: { type: "string", example: "1.0.0" },
            description: "클라이언트 앱 버전",
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
