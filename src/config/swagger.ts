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
      "- 🎯 인구감소지역 가중치 기반 랜덤 관광지 매칭\n" +
      "- 📍 GPS 기반 반경 500m 체크인\n" +
      "- 📘 228개 지역 여권(도장) 수집 현황\n" +
      "- 🏆 유저 / 인기 지역 랭킹",
    version: "1.0.0",
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
          "사용자 현재 GPS 기반으로 반경 내 관광지 중 랜덤 1곳을 반환합니다. 인구감소지역에 70% 가중치가 적용됩니다.",
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
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "인증 필요" },
          "404": { description: "주변에 매칭 가능한 관광지 없음" },
        },
      },
    },
    "/api/mission/check-in": {
      post: {
        tags: ["Mission"],
        summary: "방문 인증 (체크인)",
        description:
          "클라이언트의 현재 GPS와 목적지 좌표를 비교하여 반경 500m 이내일 경우 도장을 부여합니다. 같은 장소에 하루 1회만 체크인 가능합니다.",
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
                    message: { type: "string", example: "🎉 경복궁 방문 인증 완료!" },
                    stamp: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        placeName: { type: "string" },
                        regionName: { type: "string" },
                        checkedInAt: { type: "string", format: "date-time" },
                        totalStamps: { type: "integer" },
                      },
                    },
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
                              lastVisitedAt: { type: "string", format: "date-time", nullable: true },
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
        description: "전체 사용자 도장 개수 기준 실시간 상위 TOP 10 유저를 반환합니다.",
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
        description: "최근 1주일간 가장 많이 체크인된 지역 TOP 10을 반환합니다.",
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
  },
};
