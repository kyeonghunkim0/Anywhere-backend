# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 따라야 할 규칙입니다.

## 1. 프로젝트 개요

**아무데나(Anywhere)** — 전국 228개 기초자치단체를 랜덤 매칭하고, 현장 체크인으로 도장(스탬프)을 모으는 국내 여행 앱의 백엔드 API 서버입니다.

- **스택**: Node.js + TypeScript(strict) + Express 5 + Prisma 7 + PostgreSQL
- **인증**: Apple / Google 소셜 로그인 → 자체 JWT 발급
- **외부 연동**: 한국관광공사 TourAPI 4.0 (`KorService2`) — 관광지 데이터를 `places` 테이블에 캐시
- **배치**: `node-cron`으로 매일 새벽 3시 TourAPI 동기화
- **문서**: 서버 실행 시 `/api-docs` 에서 Swagger UI 제공

도메인 개념: 지역(Region) 228개 · 관광지 캐시(Place) · 도장(UserStamp) · 매칭 이력(MatchHistory) · 태그(Tag/PlaceTag) · 배지(Badge/UserBadge)

## 2. 빌드 & 실행

명령어 전체 목록과 사용 시나리오는 @COMMANDS.md 를 참조하세요. 자주 쓰는 것만:

| 목적 | 명령어 |
| --- | --- |
| 개발 서버(핫 리로드) | `npm run dev` |
| 타입 체크 + 빌드 | `npm run build` |
| Prisma Client 재생성 | `npm run prisma:generate` |
| 마이그레이션 생성/적용 | `npm run prisma:migrate` |
| 228개 지역 시드 | `npm run seed` |
| 게이미피케이션 시드 | `npm run seed:gamification` |

**작업 완료 전 반드시 `npm run build`를 실행해 타입 에러가 없는지 확인하세요.** 테스트 러너와 린터는 아직 도입되어 있지 않습니다 — 없는 명령을 지어내지 마세요.

`schema.prisma`를 수정했다면 `npm run prisma:generate`를 실행해야 `src/generated/prisma`의 타입이 갱신됩니다.

## 3. 아키텍처 (Routes → Controller → Service)

```
src/
  index.ts          앱 부트스트랩 · 미들웨어 · 라우트 등록 · 크론 시작
  config/           env.ts(환경변수 + 검증), swagger.ts(OpenAPI 문서)
  routes/           Express Router. 경로 정의와 미들웨어 부착만.
  controllers/      HTTP 경계. 입력 검증 · 응답 포맷 · try/catch.
  services/         비즈니스 로직 + Prisma 쿼리. Express 타입 금지.
  middlewares/      auth.middleware.ts (JWT 검증, AuthRequest 타입)
  jobs/             node-cron 스케줄러
  utils/            prisma(싱글턴), googleAuth, appleAuth, haversine, gamification
  generated/prisma/ Prisma 생성 코드 — 절대 직접 수정하지 마세요.
```

**레이어 규칙**

- 컨트롤러는 얇게: 파라미터 추출 → 필수값 검증 → 서비스 호출 → 응답. 로직은 서비스로.
- 서비스는 `Request`/`Response`를 import하지 않습니다. 실패는 `throw new Error("한국어 메시지")`로 알리고, HTTP 상태 코드 결정은 컨트롤러가 합니다.
- DB 접근은 서비스 계층에서만. 컨트롤러에서 `prisma`를 직접 부르지 마세요.
- Prisma는 항상 `src/utils/prisma.ts`의 싱글턴 `prisma`를 import합니다. `new PrismaClient()`를 새로 만들지 마세요.
- 새 도메인을 추가할 때는 `routes` / `controllers` / `services` 3개 파일을 같은 이름으로 만들고, `index.ts`에 `app.use("/api/...", xxxRoutes)`를 등록한 뒤 `config/swagger.ts`에도 스펙을 추가합니다.

## 4. 코드 스타일

- **ES modules 문법을 쓰되, 상대 경로 import에는 반드시 `.js` 확장자를 붙입니다** (`from "../services/foo.service.js"`). `package.json`은 `commonjs`이고 tsconfig는 `NodeNext`라 확장자가 빠지면 빌드가 깨집니다.
- **named export만 사용합니다.** 예외는 `routes/*.ts`의 `export default router` 하나뿐입니다.
- 컨트롤러 함수 이름은 `xxxController`, 서비스 함수는 동사형(`getPassport`, `syncAllPlaces`).
- TypeScript strict 모드. `any` 금지 — 필요하면 `interface`로 반환 타입을 명시하세요. 서비스의 반환 타입은 항상 선언합니다.
- 모든 컨트롤러의 async 본문은 `try/catch`로 감싸고, `catch`에서 `console.error("...에러:", error)` 후 500을 응답합니다.
- 주석·에러 메시지·로그는 **한국어**로 작성합니다. 기존 파일의 `// ===` 구분선 스타일을 따르세요.

## 5. API 응답 규약

성공/실패 모두 아래 형태를 지킵니다. 새 엔드포인트도 예외 없이 동일하게 맞추세요.

```ts
// 성공
res.json({ success: true, data: result });

// 실패
res.status(400).json({ success: false, message: "userId는 필수입니다." });
```

- 400: 필수 파라미터 누락 / 잘못된 입력
- 401: 토큰 없음·만료·무효 (`authMiddleware`가 처리)
- 404: 리소스 없음
- 500: 그 외 서버 오류 — `message`는 `"서버 오류가 발생했습니다."`로 통일

인증이 필요한 라우트는 `router.use(authMiddleware)` 또는 핸들러 앞에 미들웨어를 붙이고, 컨트롤러 시그니처는 `(req: AuthRequest, res: Response)`를 사용합니다. 로그인(`/api/auth/login`), 헬스체크, `/api/app`, 공개 조회 API는 미인증입니다.

## 6. 데이터베이스

- 스키마 변경은 `prisma/schema.prisma`에서만. 모든 모델에 `@@map("snake_case")`로 실제 테이블명을 지정합니다.
- 마이그레이션 파일을 손으로 만들지 말고 `npm run prisma:migrate`로 생성하세요.
- ID는 `String @id @default(cuid())`, 시간 필드는 `createdAt`/`updatedAt` 관례를 유지합니다.
- 자주 조회하는 외래키에는 `@@index`를 붙입니다.
- 목록 집계는 N+1을 피해 `groupBy` / `include`로 한 번에 가져오세요 (예: `passport.service.ts`).

## 7. 환경변수 & 보안

- 새 환경변수는 (1) `src/config/env.ts`의 `env` 객체, (2) `.env.example`, (3) 필수라면 `validateEnv()`의 `required` 배열 — 세 곳 모두 갱신합니다.
- 코드에서 `process.env`를 직접 읽지 말고 `env`를 import하세요 (`utils/prisma.ts` 예외).
- **`.env`, 실제 API 키, 토큰, DB 접속 정보는 절대 커밋하거나 파일에 하드코딩하지 마세요.** 로그에도 토큰 원문을 찍지 않습니다.
- 소셜 로그인 토큰 검증은 반드시 `utils/googleAuth.ts` / `utils/appleAuth.ts`를 거칩니다. 토큰을 디코드만 하고 서명 검증을 생략하지 마세요.

## 8. 작업 방식

- 기본 브랜치는 `develop`입니다. 기능 작업은 별도 브랜치에서 하고, 사용자가 요청하지 않으면 커밋·푸시하지 않습니다.
- 커밋 메시지는 Conventional Commits + 한국어 본문 (`feat: 게이미피케이션 테이블/API 추가`).
- 기존 파일의 구조·네이밍을 먼저 확인하고 그 패턴을 따르세요. 새 라이브러리를 추가하기 전에 `package.json`에 이미 있는지 확인합니다.
- 요청 범위 밖의 리팩터링은 하지 않습니다.
