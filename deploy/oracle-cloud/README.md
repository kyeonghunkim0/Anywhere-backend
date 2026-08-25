# Oracle Cloud(OCI) 배포 가이드

아무데나 서버를 **OCI Compute(VM)** 에 올리고 **OCI 관리형 PostgreSQL** 에 연결하는 절차입니다.

---

## 1. OCI PostgreSQL (DB with PostgreSQL)

1. 콘솔 → **Databases → PostgreSQL → DB systems → Create**
   - Shape: Always Free 대상이면 최소 구성 선택
   - Network: 서버 VM과 **같은 VCN의 프라이빗 서브넷**에 배치
2. 생성 후 **Endpoint(호스트:5432)**, **admin 사용자명/비밀번호** 확인
3. **CA 인증서 다운로드** (DB system 상세 → Connection → CA certificate)
   VM으로 복사: `scp ca.pem ubuntu@<VM_IP>:/home/ubuntu/Anywhere_server/certs/oci-ca.pem`
4. 보안 목록/NSG에서 VM 서브넷 → DB 5432 인그레스 허용
5. `.env` 설정

```bash
DATABASE_URL="postgresql://admin:PASSWORD@<DB_ENDPOINT>:5432/anywhere"
DATABASE_SSL="true"
DATABASE_CA_CERT="/home/ubuntu/Anywhere_server/certs/oci-ca.pem"
```

> 코드 쪽은 이미 대응되어 있습니다. `src/utils/prisma.ts`가 `DATABASE_SSL=true`일 때
> CA 파일을 읽어 `rejectUnauthorized: true`로 TLS 연결합니다.

6. 스키마 반영 (VM에서 1회)

```bash
npx prisma migrate deploy
npm run seed            # 228개 지역
npm run seed:gamification
```

---

## 2. OCI Compute (서버 호스팅)

### 2-1. 인스턴스 생성
- Shape: **VM.Standard.A1.Flex** (Ampere ARM, Always Free 4 OCPU / 24GB)
- Image: **Canonical Ubuntu 22.04**
- SSH 키 등록, 퍼블릭 서브넷 배치

### 2-2. 네트워크 열기
- VCN 보안 목록 인그레스: **80, 443** (0.0.0.0/0)
- 인스턴스 방화벽(Ubuntu는 iptables가 기본 차단):

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

> 3000 포트는 외부에 열지 않습니다. Nginx가 127.0.0.1:3000으로 프록시합니다.

### 2-3. 런타임 설치

```bash
sudo apt update && sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2-4. 코드 배포

```bash
cd /home/ubuntu
git clone <저장소 URL> Anywhere_server
cd Anywhere_server
cp .env.example .env && nano .env   # 실제 값 입력 (NODE_ENV=production)
npm ci && npm run prisma:generate && npm run build
```

### 2-5. systemd 등록

```bash
sudo cp deploy/oracle-cloud/anywhere.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now anywhere
sudo journalctl -u anywhere -f     # 로그 확인
```

### 2-6. Nginx + HTTPS

```bash
sudo cp deploy/oracle-cloud/nginx.conf /etc/nginx/sites-available/anywhere
sudo ln -s /etc/nginx/sites-available/anywhere /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo snap install --classic certbot
sudo certbot --nginx -d api.example.com
```

---

## 3. 이후 배포

```bash
bash deploy/oracle-cloud/deploy.sh develop
```

코드 pull → `npm ci` → `prisma generate` → `migrate deploy` → `build` → 서비스 재시작 → 헬스체크까지 수행합니다.

---

## 4. 점검 체크리스트

| 항목 | 확인 방법 |
| --- | --- |
| 서버 상태 | `sudo systemctl status anywhere` |
| 로그 | `sudo journalctl -u anywhere -n 100 --no-pager` |
| 헬스체크 | `curl https://api.example.com/health` |
| DB 연결 | `npx prisma db execute --stdin <<< "select 1;"` |
| 크론 동작 | 매일 03:00 로그에 TourAPI 동기화 출력 (`SYNC_CRON_SCHEDULE`) |

> ⚠️ `.env`와 CA 인증서(`certs/`)는 절대 커밋하지 마세요. `.gitignore`에 등록되어 있습니다.
