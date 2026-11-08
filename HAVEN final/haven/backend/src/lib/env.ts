import "dotenv/config";
import { z } from "zod";

// ตรวจสอบตัวแปร environment ด้วย Zod ตั้งแต่ตอนเริ่มเซิร์ฟเวอร์
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  AI_MODEL: z.string().default("claude-haiku-5-5"),
});

export const env = EnvSchema.parse(process.env);
