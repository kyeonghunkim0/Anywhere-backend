import express from "express";
import cors from "cors";
import { env, validateEnv } from "./config/env.js";

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
// TODO: API 라우트 마운트 (추후 추가)
// app.use("/api/auth", authRoutes);
// app.use("/api/match", matchRoutes);
// app.use("/api/mission", missionRoutes);
// app.use("/api/passport", passportRoutes);
// app.use("/api/ranking", rankingRoutes);
// ============================================

// ============================================
// 서버 시작
// ============================================
app.listen(env.PORT, () => {
  console.log(`🚀 Anywhere 서버가 포트 ${env.PORT}에서 실행 중입니다.`);
  console.log(`📡 Health Check: http://localhost:${env.PORT}/health`);
});
