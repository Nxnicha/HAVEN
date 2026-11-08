import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { aiSummary, analyzeBills, analyzeParcels, analyzeParking } from "../services/ai";

const r = Router();

// ผู้พักอาศัยดูการพยากรณ์ที่จอดได้ (ช่วงเวลาที่ควรเลี่ยง)
r.get("/parking", requireAuth, async (_req, res) => res.json(await analyzeParking()));

r.get("/parcels", requireAuth, requireAdmin, async (_req, res) => res.json(await analyzeParcels()));
r.get("/bills", requireAuth, requireAdmin, async (_req, res) => res.json(await analyzeBills()));
r.get("/summary", requireAuth, requireAdmin, async (_req, res) => res.json(await aiSummary()));

export default r;
