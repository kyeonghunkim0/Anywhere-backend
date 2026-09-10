import { Router } from "express";
import { getAppInfoController } from "../controllers/app.controller.js";

const router = Router();

/**
 * GET /api/app/info?version=&platform=
 * 앱 최초 실행 시 버전/강제 업데이트/점검 상태 확인 (인증 불필요)
 */
router.get("/info", getAppInfoController);

export default router;
