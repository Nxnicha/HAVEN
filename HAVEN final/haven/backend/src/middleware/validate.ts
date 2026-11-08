import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

type Part = "body" | "query" | "params";

/** Middleware ตรวจสอบ request ด้วย Zod schema แล้วเก็บค่าที่ parse แล้วไว้ใน res.locals */
export const validate =
  (schema: ZodTypeAny, part: Part = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        errors: result.error.flatten().fieldErrors,
      });
    }
    res.locals[part] = result.data;
    next();
  };
