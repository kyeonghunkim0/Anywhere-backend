# 🚀 아무데나(Anywhere) 서버 — 명령어 가이드

> 이 프로젝트는 **Node.js + TypeScript + Prisma** 기반입니다.
> 아래 명령어들을 순서대로 따라하면 누구나 쉽게 개발 환경을 세팅하고 서버를 실행할 수 있습니다.

---

## 1. 📦 패키지 설치

프로젝트를 처음 클론하거나, `package.json`이 변경되었을 때 실행합니다.

```bash
npm install
```

새로운 라이브러리가 필요할 때:
```bash
npm install 패키지이름          # 런타임 의존성
npm install -D 패키지이름       # 개발 전용 의존성 (타입 등)
```

---

## 2. 🗄️ 데이터베이스 (Prisma)

### Prisma Client 생성

`schema.prisma`를 수정한 뒤 반드시 실행해야 합니다. 코드에서 사용하는 타입이 이 명령으로 생성됩니다.

```bash
npm run prisma:generate
```

### DB 마이그레이션 (스키마 반영)

`schema.prisma`에서 테이블 구조를 변경한 뒤, 실제 DB에 반영할 때 사용합니다.

```bash
npm run prisma:migrate
```
> 실행하면 마이그레이션 이름을 물어봅니다. 예: `add_match_history`

### 228개 지역 시드 데이터 삽입

최초 1회, 또는 지역 데이터를 초기화하고 싶을 때 실행합니다.

```bash
npx tsx prisma/seed.ts
```

### Prisma Studio (DB 시각화 도구)

브라우저에서 DB 테이블을 직접 보고 편집할 수 있는 GUI 도구입니다.

```bash
npm run prisma:studio
```
> 실행 후 자동으로 브라우저가 열립니다. (기본: http://localhost:5555)

---

## 3. 🖥️ 서버 켜기 / 끄기

### 개발용 서버 켜기 (Auto-reload 모드)

코드를 수정하고 저장하면 알아서 서버가 재시작되는 편리한 모드입니다.

```bash
npm run dev
```

### 서버 끄기

서버가 돌아가고 있는 터미널 창에서 `Ctrl + C`를 누르면 안전하게 종료됩니다.

### 프로덕션 빌드 & 실행

배포용으로 TypeScript를 JavaScript로 컴파일한 뒤 실행합니다.

```bash
npm run build        # TypeScript → JavaScript 컴파일
npm run start        # 컴파일된 JS 서버 실행
```

---

## 4. 🌐 자주 쓰는 주소 (포트를 3000으로 열었을 때)

| 용도 | 주소 |
|------|------|
| 로컬 API 서버 | http://localhost:3000 |
| Health Check | http://localhost:3000/health |
| **Swagger UI** (API 테스트 및 문서) | http://localhost:3000/api-docs |

> 💡 **Swagger UI**에서 직접 API에 데이터를 넣어보고 테스트할 수 있습니다.
> 인증이 필요한 API는 먼저 `/api/auth/login`으로 토큰을 받은 뒤, 상단의 **Authorize** 버튼에 `Bearer <토큰>` 형식으로 입력하세요.

---

## 5. 💡 환경변수 파일 (.env)

### 설정 방법

`.env.example` 파일을 복사해서 `.env`로 만들고, 실제 값을 채워 넣습니다.

```bash
cp .env.example .env
```

### 주요 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `PORT` | 서버 포트 | `3000` |
| `DATABASE_URL` | PostgreSQL 접속 URL | `postgresql://user@localhost:5432/anywhere` |
| `JWT_SECRET` | JWT 토큰 암호화 키 | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT 토큰 만료 기간 | `7d` |
| `TOUR_API_KEY` | 한국관광공사 TourAPI 키 | `발급받은 서비스키` |
| `SYNC_CRON_SCHEDULE` | TourAPI 동기화 크론 스케줄 | `0 3 * * *` (매일 새벽 3시) |

### ⚠️ 주의사항

- `.env` 파일은 **절대 깃허브에 올리지 마세요!** (`.gitignore`에 이미 추가되어 있어 `git add .`을 해도 안전하게 제외됩니다.)
- 다른 팀원과 공유할 때는 `.env.example` 파일에 빈 양식만 남겨서 공유하면 됩니다.
- TourAPI 키는 [공공데이터포털](https://www.data.go.kr/)에서 발급받을 수 있습니다.

---

## 6. 🔧 기타 유용한 명령어

### TypeScript 타입 체크 (빌드 없이 문법만 검사)

```bash
npx tsc --noEmit
```

### Git 관련

```bash
git status                    # 변경된 파일 확인
git add .                     # 모든 변경사항 스테이징
git commit -m "커밋 메시지"     # 커밋
git log --oneline -10         # 최근 10개 커밋 히스토리
```

---

## 📋 처음 세팅할 때 순서 요약

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 파일 만들기
cp .env.example .env
# → .env 파일을 열어서 실제 값 채우기

# 3. Prisma Client 생성
npm run prisma:generate

# 4. DB 마이그레이션 (테이블 생성)
npm run prisma:migrate

# 5. 228개 지역 시드 데이터 삽입
npx tsx prisma/seed.ts

# 6. 개발 서버 실행 🚀
npm run dev
```
