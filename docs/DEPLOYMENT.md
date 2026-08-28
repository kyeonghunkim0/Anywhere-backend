# 환경 정책 & 배포 가이드

이 문서는 **로컬 개발 환경과 운영(Production) 환경을 어떻게 분리·관리할지**, **코드를 수정한 뒤 운영 서버에 어떻게 반영할지**, 그리고 **`npm run` 명령어가 어디서(로컬/서버) 어떤 상황에 안전한지**를 정리합니다.

---

## 1. 환경 정책

### 1-1. 현재는 2단계 (local / production)

혼자 개발하는 단계에서는 로컬(local)과 운영(production) 두 단계로 충분합니다. staging을 미리 만들어두는 비용(별도 인스턴스 관리, DB 동기화)이 지금 얻는 이득보다 큽니다.

staging이 필요해지는 시점의 신호:
- 앱스토어 심사가 운영 서버를 직접 호출하기 시작할 때
- 마이그레이션 롤백이 무서워질 정도로 운영 데이터가 쌓였을 때

그때는 남는 Always Free Micro 인스턴스 슬롯을 staging으로 올리면 됩니다 (VCN/서브넷/보안목록은 이미 구성되어 있어 인스턴스만 추가하면 됨).

### 1-2. 브랜치 ↔ 환경 매핑

| 브랜치 | 용도 |
|---|---|
| `develop` | 기본 개발 브랜치. 로컬에서 이 브랜치로 작업 |
| `master` | 운영 배포 기준. 운영 서버는 이 브랜치를 배포해야 함 |
| `feat/*` | 기능 브랜치. 완료 후 `develop`에 머지 |

`deploy/oracle-cloud/deploy.sh`는 브랜치를 인자로 받습니다 (기본값 `develop`). 운영 서버에서 실행할 때는 반드시 배포하려는 브랜치명을 명시하세요.

### 1-3. 서버 정보 (운영)

| 항목 | 값 |
|---|---|
| Public IP | `161.33.223.198` (Ephemeral — 인스턴스를 삭제하지 않는 한 재부팅해도 유지) |
| OS | Oracle Linux 9.8 |
| SSH 계정 | `opc` (Ubuntu 아님 — 배포 문서의 `ubuntu@` 예시는 무시) |
| 앱 경로 | `/opt/anywhere` (SELinux가 `/home` 아래 파일을 systemd가 읽지 못하게 막아서 `/opt`로 이동함) |
| 프로세스 관리 | systemd 서비스 `anywhere` (`sudo systemctl status anywhere`) |
| 웹서버 | nginx (`/etc/nginx/conf.d/anywhere.conf`), 80 → 127.0.0.1:3000 리버스 프록시 |
| DB | 같은 VM의 로컬 PostgreSQL 16 (`anywhere` DB, `anywhere` 유저) |
| SSH 키 | Aside 비밀번호 관리자에 "Anywhere OCI SSH key (2026-08-27)"로 백업됨 |

---

## 2. 환경변수 정책

`.env`는 절대 커밋하지 않습니다 (`.gitignore`에 등록되어 있음). 로컬과 운영은 **다른 `.env` 파일**을 각자 보관합니다.

### 2-1. 환경마다 반드시 다르게 설정해야 하는 값

| 변수 | 이유 |
|---|---|
| `JWT_SECRET` | 유출/공유 시 토큰 위조 가능. 로컬 개발용 값(`dev-secret-key-change-in-production`)을 운영에 쓰면 안 됨 |
| `DATABASE_URL` | 로컬 DB와 운영 DB 계정/비밀번호가 다름 |
| `NODE_ENV` | `production`일 때만 `src/config/env.ts`의 운영 가드(기본 시크릿 차단 등)가 활성화됨 |
| `MAINTENANCE_MODE`, `APP_LATEST_VERSION`, `APP_MIN_VERSION` | 운영 토글이므로 로컬에서 건드릴 필요 없음 |

### 2-2. 공유해도 되는 값

| 변수 | 비고 |
|---|---|
| `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID` | iOS 앱 번들과 묶여 있어 앱을 별도로 만들지 않는 한 환경 상관없이 동일 |
| `TOUR_API_KEY` / `PHOTO_API_KEY` | 로컬/운영이 같은 키를 공유. 단, 한국관광공사 API 일일 호출 쿼터를 로컬 테스트와 운영이 나눠 쓰게 됨을 인지할 것 |
| `SYNC_CRON_SCHEDULE`, `JWT_EXPIRES_IN` | 값 자체가 민감하지 않음 |

### 2-3. 안전장치

`src/config/env.ts`의 `validateEnv()`가 `NODE_ENV=production`일 때 아래를 강제합니다:

- `JWT_SECRET`이 기본값(`fallback-secret`)이면 서버 기동 실패
- `DATABASE_URL`이 `postgres`로 시작하지 않으면 서버 기동 실패
- `DATABASE_SSL=true`인데 `DATABASE_CA_CERT`가 없으면 서버 기동 실패

> ⚠️ 이 가드는 `fallback-secret` 문자열만 막습니다. 로컬 `.env`의 `JWT_SECRET` 값을 그대로 복사해서 운영에 넣으면 가드를 통과해버립니다. **운영 `JWT_SECRET`은 항상 새로 생성하세요** (예: `openssl rand -base64 48`).

### 2-4. 새 환경변수를 추가할 때

`CLAUDE.md`에 명시된 대로 아래 3곳을 모두 갱신해야 합니다:
1. `src/config/env.ts`의 `env` 객체
2. `.env.example`
3. 필수 값이면 `validateEnv()`의 `required` 배열

---

## 3. 코드 변경 → 운영 서버 반영 절차

### 3-1. 기본 흐름

```
로컬에서 커밋/푸시 → 서버에 SSH 접속 → deploy.sh 실행
```

### 3-2. 로컬에서 할 일

```bash
git add .
git commit -m "fix: 설명"
git push origin develop        # 또는 작업 브랜치 → develop 머지 후 push
```

운영에 반영하려면 `develop`을 `master`로 머지하고 push합니다 (`master`가 아직 배포 기준으로 안 굳어졌다면, 우선 서버가 추적할 브랜치를 팀 정책으로 정하세요).

### 3-3. 서버에서 할 일

```bash
ssh -i <SSH 키 경로> opc@161.33.223.198
cd /opt/anywhere
bash deploy/oracle-cloud/deploy.sh <브랜치명>   # 예: bash deploy/oracle-cloud/deploy.sh develop
```

`deploy.sh`가 순서대로 수행하는 작업:

1. `git fetch` + `git reset --hard origin/<브랜치>` — 로컬 변경사항은 버려짐 (서버에서 직접 코드 수정 금지)
2. `npm ci` — 의존성 재설치
3. `npm run prisma:generate` — Prisma Client 재생성
4. `npx prisma migrate deploy` — **생성이 아니라 적용만**. 새 마이그레이션 파일은 로컬에서 미리 만들어서 커밋해둬야 함
5. `npm run build` — TypeScript 컴파일
6. `sudo systemctl restart anywhere`
7. `/health` 헬스체크

### 3-4. 마이그레이션 정책 (중요)

```
로컬:  npm run prisma:migrate     (내부적으로 prisma migrate dev — 마이그레이션 파일 생성)
운영:  npx prisma migrate deploy  (deploy.sh가 자동 실행 — 적용만, 생성 안 함)
```

**운영 서버에서 `prisma migrate dev`나 `prisma migrate reset`을 절대 실행하지 마세요.** 스키마 드리프트를 감지하면 대화형으로 DB를 초기화하려 시도합니다. `migrate deploy`만 사용해야 안전합니다.

### 3-5. 배포 전 로컬 체크리스트

- [ ] `npm run build` 성공 (타입 에러 없음)
- [ ] **`npm run build && npm start`까지 한 번 로컬에서 돌려볼 것.** `npm run dev`(tsx)는 정상인데 컴파일된 결과물만 죽는 버그가 있었음 (§5 참고)
- [ ] `schema.prisma`를 수정했다면 마이그레이션 파일이 커밋에 포함됐는지 확인
- [ ] `.env.example`에 새 변수가 반영됐는지 확인

---

## 4. 백업 (아직 미구현 — TODO)

현재 운영 DB 백업이 없습니다. 인스턴스가 삭제되면 데이터가 전부 사라집니다.

권장 방향 (아직 적용 안 됨):
- `pg_dump`를 매일 새벽 크론으로 실행해 로컬 디스크에 최근 7일치 보관
- 선택: OCI Object Storage(Always Free 10GB)에 업로드해 인스턴스 자체가 사라져도 복구 가능하게 함
- 운영 `.env` 원본은 비밀번호 관리자에도 백업 (서버가 유일한 사본이 되지 않게)

---

## 5. `npm run` 명령어 레퍼런스

| 명령어 | 실행 위치 | 안전도 | 설명 |
|---|---|---|---|
| `npm run dev` | 로컬 전용 | 안전 | `tsx watch`로 핫 리로드. 운영 서버에서 쓰지 않음 (systemd가 `node dist/index.js`로 직접 실행) |
| `npm run build` | 로컬 + 서버 | 안전 | TypeScript → JS 컴파일. `deploy.sh`가 자동 실행 |
| `npm run start` | 서버 전용 | 안전 | 컴파일된 JS 실행. 로컬에서 직접 쓸 일은 거의 없음(`npm run dev` 사용) |
| `npm run prisma:generate` | 로컬 + 서버 | 안전 | `schema.prisma` 수정 후 필수. `deploy.sh`가 자동 실행 |
| `npm run prisma:migrate` | **로컬 전용** | 주의 | `prisma migrate dev`. 대화형 프롬프트 + 필요시 DB 리셋. 서버에서 실행 금지 |
| `npm run prisma:studio` | 로컬 전용 | 안전 | DB GUI (localhost:5555). 운영 DB에 직접 연결해서 쓰지 않기를 권장 |
| `npm run seed` | 최초 1회 (재실행 안전) | 안전 | 229개 지역 데이터 삽입. `upsert` 기반이라 재실행해도 중복 생성 안 됨 |
| `npm run seed:gamification` | 최초 1회 (재실행 안전) | 안전 | 태그/뱃지 시딩. `upsert` 기반이라 재실행 안전 |
| `npm run seed:region-photos` | 선택 | 주의 | `PHOTO_API_KEY` 필요. 지역 대표사진 시딩 |
| `npx prisma migrate deploy` | **서버 전용** | 안전 | 생성된 마이그레이션 파일을 적용만 함. 운영에서 스키마 반영할 때 이것만 사용 |
| `npx tsc --noEmit` | 로컬 | 안전 | 빌드 없이 타입 체크만 |

### `npm run dev`, 아직 쓸 수 있나?

**네, 그대로 씁니다.** 이번에 Prisma Client의 모듈 포맷을 CJS로 고정(`prisma/schema.prisma`의 `moduleFormat = "cjs"`)했지만, `tsx`는 TypeScript를 직접 실행하며 ESM/CJS를 알아서 처리하기 때문에 `npm run dev`는 영향받지 않습니다. 실제로 이 fix가 필요했던 이유도 `npm run dev`가 아니라 **컴파일 후 `npm start`(운영 방식)에서만** `SyntaxError: Cannot use 'import.meta' outside a module`가 터졌기 때문입니다.

즉:
- `npm run dev` (tsx) → 항상 정상, 로컬 개발은 이걸로 계속 쓰면 됨
- `npm run build && npm run start` (컴파일 후 실행, 운영과 동일한 방식) → 반드시 배포 전에 로컬에서 한 번 검증할 것

---

## 6. 릴리스 체크리스트 (변경사항을 운영에 반영하기)

§3이 "어떤 명령을 치는가"라면, 이 절은 "무엇을 확인하고 치는가"입니다. 변경 종류에 따라 필요한 단계가 달라집니다.

### 6-1. 변경 종류별 필요 작업

| 변경 종류 | 마이그레이션 | 시드 재실행 | 앱 릴리스 필요 | 비고 |
|---|---|---|---|---|
| 응답 필드 **추가** (예: `displayName`) | 불필요 | 불필요 | 불필요 | 기존 앱은 모르는 필드를 무시하므로 하위 호환 |
| 응답 필드 **삭제·이름 변경** | 불필요 | 불필요 | **필요** | 구버전 앱이 깨짐. 앱 강제 업데이트(`APP_MIN_VERSION`)와 함께 계획할 것 |
| `schema.prisma` 변경 | **필요** (로컬에서 파일 생성 후 커밋) | 경우에 따라 | 경우에 따라 | `deploy.sh`가 `migrate deploy`로 적용 |
| 시드 데이터 문구·값 변경 (뱃지/태그 등) | 불필요 | **필요** (서버에서 수동 실행) | 불필요 | `npm run seed:gamification` 등은 upsert라 재실행 안전 |
| 환경변수 추가 | 불필요 | 불필요 | 불필요 | 운영 `.env`에 값을 **먼저** 넣고 배포 (§2-4) |
| 상수·로직 변경 | 불필요 | 불필요 | 불필요 | 아래 6-2의 "개발용 임시 값" 항목 주의 |

### 6-2. 배포 전 확인 (로컬)

- [ ] `npm run build` 성공
- [ ] `npm run build && npm start` 로 운영과 동일한 방식으로 한 번 기동 (§5 참고)
- [ ] **개발 편의로 바꾼 임시 값이 남아 있지 않은지 확인.** 예: `MAX_DAILY_MATCHES`(하루 매칭 제한, 운영값 3), `MAINTENANCE_MODE`
- [ ] **테스트 전용 시드가 운영에서 실행될 여지가 없는지 확인.** `npm run seed:test-places`는 가짜 관광지(`contentId`가 `TEST-`로 시작)를 넣으므로 **로컬 전용**이다. `deploy.sh`는 시드를 실행하지 않으니 사람이 직접 치지만 않으면 안전하다
- [ ] `schema.prisma`를 건드렸다면 마이그레이션 파일이 커밋에 포함됐는지
- [ ] `.env.example`에 새 변수가 반영됐는지

### 6-3. 반영

```bash
# 로컬
git checkout develop
git merge feat/<작업 브랜치>
git push origin develop

git checkout master && git merge develop && git push origin master
```

```bash
# 서버
ssh -i <SSH 키 경로> opc@161.33.223.198
cd /opt/anywhere
bash deploy/oracle-cloud/deploy.sh master
```

### 6-4. 배포 후 확인

```bash
# 서버에서
sudo systemctl status anywhere
sudo journalctl -u anywhere -n 50 --no-pager     # 기동 에러 확인

# 어디서든
curl -s http://161.33.223.198/health
curl -s http://161.33.223.198/api/ranking/places | head -c 300   # 실제 변경된 응답 확인
```

시드 재실행이 필요한 변경이었다면 이 시점에 서버에서 한 번 돌립니다:

```bash
cd /opt/anywhere && npm run seed:gamification
```

### 6-5. 롤백

`deploy.sh`는 브랜치를 받으므로, 직전 커밋으로 되돌릴 때도 같은 스크립트를 씁니다.

```bash
# 로컬에서 master를 되돌려 push (되돌림 커밋 방식이 안전)
git checkout master && git revert <문제 커밋> && git push origin master
# 서버에서 다시 배포
bash deploy/oracle-cloud/deploy.sh master
```

마이그레이션이 포함된 배포는 코드만 되돌려도 스키마는 남습니다. 되돌릴 수 있는 형태(컬럼 추가는 안전, 삭제·이름 변경은 위험)로 나눠서 배포하세요.

---

## 7. 클라이언트(iOS) 연동 — baseURL

앱은 `Projects/AnywhereApp/Sources/AnywhereApp.swift`의 `init()`에서 빌드 구성에 따라 baseURL을 정합니다.

| 빌드 | baseURL | 비고 |
|---|---|---|
| DEBUG | `http://<맥의 LAN IP>:3000` | 실기기는 `localhost`로 붙을 수 없다. 카페·핫스팟 등 네트워크가 바뀌면 IP도 바뀌므로 그때마다 수정해야 한다 (`ipconfig getifaddr en0`) |
| RELEASE | 운영 서버 주소 | 아래 ATS 제약 참고 |

### 7-1. ATS(App Transport Security) 제약

`Tuist/Config/Info.plist`의 ATS 설정은 현재 `NSAllowsLocalNetworking`만 켜져 있습니다. 이건 **사설 IP 대역(192.168.x.x, 172.16~31.x.x 등)에 대한 평문 HTTP만** 허용합니다. 즉:

- DEBUG에서 맥 LAN IP로 붙는 것 → 통과
- RELEASE에서 `http://161.33.223.198`(공인 IP, 평문 HTTP)로 붙는 것 → **iOS가 차단**

따라서 운영 배포 전에 **도메인 + HTTPS**가 필요합니다:

1. 도메인을 사서 A 레코드를 `161.33.223.198`로 지정
2. `deploy/oracle-cloud/nginx.conf`의 `server_name`을 실제 도메인으로 교체
3. 서버에서 `sudo certbot --nginx -d api.<도메인>` 으로 인증서 발급 (nginx 블록이 자동으로 443으로 재작성됨)
4. 앱의 RELEASE baseURL을 `https://api.<도메인>` 으로 변경

> Let's Encrypt는 IP 주소로는 인증서를 발급하지 않습니다. ATS 예외(`NSExceptionDomains`)로 평문 HTTP를 뚫는 방법도 있지만 App Store 심사에서 사유를 요구받으므로, 도메인 + HTTPS가 정석입니다.

### 7-2. baseURL을 코드에서 빼는 것을 권장

지금은 IP가 소스에 하드코딩되어 있어 네트워크가 바뀔 때마다 커밋이 생깁니다. xcconfig에 `API_BASE_URL`을 두고 Info.plist를 거쳐 읽으면 빌드 구성만 바꿔 전환할 수 있습니다. (아직 적용 안 됨 — TODO)
