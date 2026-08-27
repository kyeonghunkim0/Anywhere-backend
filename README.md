# 아무데나 (Anywhere)

전국 228개 기초자치단체를 랜덤 매칭하고, 현장 체크인으로 도장(스탬프)을 모으는 국내 여행 앱의 백엔드 API 서버입니다.

## 기술 스택

- **런타임**: Node.js 22 + TypeScript (strict)
- **프레임워크**: Express 5
- **DB / ORM**: PostgreSQL + Prisma 7
- **인증**: Apple / Google 소셜 로그인 → 자체 JWT 발급
- **외부 연동**: 한국관광공사 TourAPI 4.0 (`KorService2`) — 관광지 데이터를 `places` 테이블에 캐시
- **배치**: `node-cron`으로 매일 새벽 3시 TourAPI 동기화
- **문서화**: 서버 실행 시 `/api-docs` 에서 Swagger UI 제공

도메인 개념: 지역(Region, 228개) · 관광지 캐시(Place) · 도장(UserStamp) · 매칭 이력(MatchHistory) · 태그(Tag/PlaceTag) · 배지(Badge/UserBadge) · 리뷰(Review)

## 빠른 시작 (로컬 개발)

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 파일 생성 후 값 채우기
cp .env.example .env

# 3. Prisma Client 생성
npm run prisma:generate

# 4. DB 마이그레이션 적용 (로컬 PostgreSQL 필요)
npm run prisma:migrate

# 5. 시드 데이터 삽입 (지역 229개 · 태그/뱃지)
npm run seed
npm run seed:gamification

# 6. 개발 서버 실행 (핫 리로드)
npm run dev
```

실행 후 확인:

| 용도 | 주소 |
|---|---|
| API 서버 | http://localhost:3000 |
| Health check | http://localhost:3000/health |
| Swagger UI | http://localhost:3000/api-docs |

명령어 전체 목록은 [`COMMANDS.md`](./COMMANDS.md)를 참고하세요.

## 프로젝트 구조

```
src/
  index.ts          앱 부트스트랩 · 미들웨어 · 라우트 등록 · 크론 시작
  config/           env.ts(환경변수 + 검증), swagger.ts(OpenAPI 문서)
  routes/           Express Router. 경로 정의와 미들웨어 부착만
  controllers/      HTTP 경계. 입력 검증 · 응답 포맷 · try/catch
  services/         비즈니스 로직 + Prisma 쿼리 (Express 타입 금지)
  middlewares/      auth.middleware.ts, error.middleware.ts
  jobs/             node-cron 스케줄러
  utils/            prisma 싱글턴, errors, prismaError, googleAuth, appleAuth, haversine, gamification
  generated/prisma/ Prisma 생성 코드 (직접 수정 금지)
prisma/
  schema.prisma     DB 스키마
  migrations/       마이그레이션 히스토리
  seed*.ts          시드 스크립트
deploy/oracle-cloud/ OCI 배포 관련 파일 (systemd unit, nginx conf, deploy.sh)
docs/
  DEPLOYMENT.md     환경 정책 · 배포 절차 · 명령어 레퍼런스
```

아키텍처 규칙, 코드 스타일, API 응답 규약 등 코드 작성 관련 상세 규칙은 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.

## 환경 및 배포

- 개발/운영 환경변수 정책, 서버에 코드 반영하는 절차, 명령어별 사용처(로컬 전용 / 서버 가능 / 위험)는 [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)에 정리되어 있습니다.
- 운영 서버는 Oracle Cloud Infrastructure(OCI) Always Free VM에서 동작합니다. 인프라 설정 절차는 [`deploy/oracle-cloud/README.md`](./deploy/oracle-cloud/README.md)를 참고하세요.

## 브랜치

- `develop` — 기본 개발 브랜치
- `master` — 운영 배포 기준 브랜치
- 기능 작업은 별도 브랜치에서 진행 후 PR/머지
