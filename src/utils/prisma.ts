import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

// Prisma Client 싱글턴 패턴
// 개발 환경에서 핫 리로딩 시 PrismaClient 인스턴스가 중복 생성되는 것을 방지
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// OCI 관리형 PostgreSQL(및 Autonomous DB)은 TLS를 요구하고,
// 사설 CA로 서명된 서버 인증서를 사용하므로 CA 파일을 직접 읽어 넘겨야 합니다.
function buildSslConfig(): { ca: string; rejectUnauthorized: boolean } | undefined {
  if (process.env.DATABASE_SSL !== "true") return undefined;

  const caPath = process.env.DATABASE_CA_CERT;
  if (!caPath) {
    throw new Error("❌ DATABASE_SSL=true이면 DATABASE_CA_CERT 경로가 필요합니다.");
  }
  if (!fs.existsSync(caPath)) {
    throw new Error(`❌ CA 인증서 파일을 찾을 수 없습니다: ${caPath}`);
  }

  return {
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: true,
  };
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    ssl: buildSslConfig(),
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
