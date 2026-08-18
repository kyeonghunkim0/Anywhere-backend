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
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";
import { startSyncPlacesJob } from "./jobs/syncPlaces.job.js";

// 환경변수 검증
validateEnv();

const app = express();

// ============================================
// 미들웨어
// ============================================
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
app.listen(env.PORT, () => {
  console.log(`🚀 Anywhere 서버가 포트 ${env.PORT}에서 실행 중입니다.`);
  console.log(`📖 Swagger:  http://localhost:${env.PORT}/api-docs`);
});
