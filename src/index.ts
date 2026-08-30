import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env, validateEnv } from "./config/env.js";
import { swaggerDocument } from "./config/swagger.js";
import authRoutes from "./routes/auth.routes.js";
import matchRoutes from "./routes/match.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import passportRoutes from "./routes/passport.routes.js";
import rankingRoutes from "./routes/ranking.routes.js";
import feedRoutes from "./routes/feed.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import badgeRoutes from "./routes/badge.routes.js";
import regionRoutes from "./routes/region.routes.js";
import userRoutes from "./routes/user.routes.js";
import appRoutes from "./routes/app.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import placeRoutes from "./routes/place.routes.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { startSyncPlacesJob } from "./jobs/syncPlaces.job.js";
import { prisma } from "./utils/prisma.js";

// 환경변수 검증
validateEnv();

const app = express();

// ============================================
// 미들웨어
// ============================================
// OCI Compute의 Nginx 리버스 프록시 뒤에서 실행되므로
// X-Forwarded-* 헤더로 실제 클라이언트 IP·프로토콜을 인식하게 합니다.
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

// ============================================
// Health Check
// ============================================
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Anywhere Server",
  });
});

// ============================================
// Swagger API 문서
// ============================================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ============================================
// API 라우트
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/mission", missionRoutes);
app.use("/api/passport", passportRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/app", appRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/places", placeRoutes);

// ============================================
// 404 · 전역 에러 핸들러 (반드시 라우트 등록 이후)
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// 크론잡 등록
// ============================================
startSyncPlacesJob();

// ============================================
// 서버 시작
// ============================================
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Anywhere 서버가 포트 ${env.PORT}에서 실행 중입니다. (${env.NODE_ENV})`);
  console.log(`📖 Swagger:  http://localhost:${env.PORT}/api-docs`);
});

// ============================================
// 그레이스풀 종료 (systemd/PM2 재시작 시 진행 중인 요청 보호)
// ============================================
async function shutdown(signal: string): Promise<void> {
  console.log(`⏹️  ${signal} 수신 - 서버를 종료합니다.`);

  server.close(async () => {
    await prisma.$disconnect();
    console.log("✅ 서버가 안전하게 종료되었습니다.");
    process.exit(0);
  });

  // 10초 안에 정리되지 않으면 강제 종료
  setTimeout(() => {
    console.error("❌ 종료가 지연되어 강제 종료합니다.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
