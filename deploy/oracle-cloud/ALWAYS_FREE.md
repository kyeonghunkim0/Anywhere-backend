# OCI Always Free 배포 메모

이 구성은 Oracle Cloud Always Free 한도를 우선합니다.

## 권장 인프라

- Compute: `VM.Standard.A1.Flex` 1대, **2 OCPU / 12GB RAM**, 부트 볼륨 50GB
- OS: Ubuntu 22.04 또는 24.04
- DB: OCI 관리형 PostgreSQL 대신 VM 내부 PostgreSQL
- 네트워크: `anywhere-public-subnet`에 VM을 배치하고 80/443만 외부 공개

> OCI의 Always Free 목록에는 Ampere A1 Compute와 MySQL HeatWave는 있지만, OCI Database with PostgreSQL은 포함되지 않습니다. 관리형 PostgreSQL을 만들면 비용이 발생할 수 있습니다.

## VM 초기 설정

```bash
sudo apt update
sudo apt install -y git nginx build-essential postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

## 로컬 PostgreSQL 생성

PostgreSQL은 기본적으로 로컬에서만 수신하므로 포트 5432를 OCI 보안 규칙에 추가하지 않습니다.

```bash
sudo -u postgres psql <<'SQL'
CREATE USER anywhere WITH ENCRYPTED PASSWORD '여기에_강력한_DB_비밀번호';
CREATE DATABASE anywhere OWNER anywhere;
SQL
```

`.env` 값:

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://anywhere:URL_ENCODED_PASSWORD@127.0.0.1:5432/anywhere?schema=public"
DATABASE_SSL=false
DATABASE_CA_CERT=""
```

나머지 필수 값은 `.env.example`의 `JWT_SECRET`, `TOUR_API_KEY`, `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID` 등을 실제 값으로 채웁니다. `.env`는 절대 커밋하지 않습니다.

## 코드 배포

```bash
cd /home/ubuntu
git clone --branch feat/oracle-cloud https://github.com/kyeonghunkim0/Anywhere-backend.git Anywhere_server
cd Anywhere_server
cp .env.example .env
nano .env
npm ci
npm run prisma:generate
npx prisma migrate deploy
npm run seed
npm run seed:gamification
npm run build
sudo cp deploy/oracle-cloud/anywhere.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now anywhere
```

Nginx 및 HTTPS 설정은 `README.md`의 2-6 절을 따릅니다. `nginx.conf`의 `api.example.com`을 실제 API 도메인으로 먼저 바꾸고 DNS A 레코드를 VM의 고정 공인 IP에 연결한 뒤 Certbot을 실행합니다.

## 이후 배포

```bash
bash deploy/oracle-cloud/deploy.sh feat/oracle-cloud
```
