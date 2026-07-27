import { type JsonObject } from "swagger-ui-express";

export const swaggerDocument: JsonObject = {
  openapi: "3.0.3",
  info: {
    title: "아무데나 (Anywhere) API",
    description:
      "전국 228개 지역을 여행하며 도장을 수집하는 '아무데나' 서비스의 백엔드 API입니다.\n\n" +
      "### 인증 방식\n" +
      "소셜 로그인 후 발급받은 JWT 토큰을 `Authorization: Bearer <token>` 헤더에 포함하여 요청합니다.\n\n" +
      "### 주요 기능\n" +
      "- 🔐 Apple / 카카오 소셜 로그인\n" +
      "- 🎯 인구감소지역 가중치 기반 랜덤 관광지 매칭 (일 3회 제한)\n" +
      "- 📍 GPS 기반 반경 500m 체크인 (인구감소지역 보상 2배)\n" +
      "- 📘 228개 지역 여권(도장) 수집 현황\n" +
      "- 🏆 유저 / 인기 지역 랭킹 + 내 랭킹 조회\n" +
      "- 📢 실시간 활동 피드",
    version: "1.1.0",
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
          socialType: { type: "string", enum: ["apple", "kakao"] },
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
          "Apple 또는 카카오 소셜 로그인을 처리합니다. 신규 유저는 자동 회원가입되며 JWT 토큰이 발급됩니다.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["socialType", "socialId"],
                properties: {
                  socialType: {
                    type: "string",
                    enum: ["apple", "kakao"],
                    description: "소셜 로그인 유형",
                  },
                  socialId: {
                    type: "string",
                    description: "소셜 플랫폼에서 받은 고유 ID",
                    example: "kakao_123456",
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
          "400": { description: "필수 파라미터 누락" },
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
  },
};
