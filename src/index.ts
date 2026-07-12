import express from "express";
import cors from "cors";
import { env, validateEnv } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import matchRoutes from "./routes/match.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import passportRoutes from "./routes/passport.routes.js";
import rankingRoutes from "./routes/ranking.routes.js";
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
// API 라우트
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/mission", missionRoutes);
app.use("/api/passport", passportRoutes);
app.use("/api/ranking", rankingRoutes);

// ============================================
// 크론잡 등록
// ============================================
startSyncPlacesJob();

// ============================================
// 서버 시작
// ============================================
app.listen(env.PORT, () => {
  console.log(`🚀 Anywhere 서버가 포트 ${env.PORT}에서 실행 중입니다.`);
  console.log(`📡 Health Check: http://localhost:${env.PORT}/health`);
  console.log(`🔐 Auth:     POST /api/auth/login`);
  console.log(`🎯 Match:    GET  /api/match/random`);
  console.log(`📍 Mission:  POST /api/mission/check-in`);
  console.log(`📘 Passport: GET  /api/passport/:userId`);
  console.log(`🏆 Ranking:  GET  /api/ranking/users | /api/ranking/places`);
});
