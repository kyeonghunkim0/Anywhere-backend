import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  TOUR_API_KEY: process.env.TOUR_API_KEY || "",
  SYNC_CRON_SCHEDULE: process.env.SYNC_CRON_SCHEDULE || "0 3 * * *",
} as const;

// 필수 환경변수 검증
export function validateEnv(): void {
  const required: (keyof typeof env)[] = ["JWT_SECRET"];

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`❌ 환경변수 ${key}가 설정되지 않았습니다. .env 파일을 확인해주세요.`);
    }
  }

  console.log("✅ 환경변수 로드 완료");
}
