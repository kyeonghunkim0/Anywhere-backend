#!/usr/bin/env bash
# OCI Compute 인스턴스에서 실행하는 배포 스크립트
# 사용법: bash deploy/oracle-cloud/deploy.sh [브랜치명]
set -euo pipefail

BRANCH="${1:-develop}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$APP_DIR"

echo "▶ 최신 코드 받기 ($BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "▶ 의존성 설치"
npm ci

echo "▶ Prisma Client 생성"
npm run prisma:generate

echo "▶ 마이그레이션 적용"
npx prisma migrate deploy

echo "▶ 빌드"
npm run build

echo "▶ 서비스 재시작"
sudo systemctl restart anywhere
sleep 3
sudo systemctl --no-pager status anywhere | head -n 15

echo "▶ 헬스체크"
curl -fsS "http://127.0.0.1:${PORT:-3000}/health" && echo "" && echo "✅ 배포 완료"
