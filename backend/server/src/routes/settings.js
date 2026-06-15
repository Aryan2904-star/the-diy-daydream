import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ah } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { emitCatalogUpdate } from "../lib/socket.js";

const router = Router();

async function getOrCreateSetting() {
  let s = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!s) s = await prisma.setting.create({ data: { id: 1 } });
  return s;
}

// Public — frontend reads the discount code + percent from here.
router.get(
  "/",
  ah(async (req, res) => {
    const s = await getOrCreateSetting();
    res.json({ code: s.code, percent: s.percent });
  })
);

router.put(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const { code, percent } = req.body || {};
    const data = {};
    if (code !== undefined) data.code = String(code).trim().toUpperCase();
    if (percent !== undefined) {
      const p = Math.round(Number(percent));
      if (!Number.isFinite(p) || p < 0 || p > 100)
        return res.status(400).json({ error: "percent must be between 0 and 100" });
      data.percent = p;
    }
    await getOrCreateSetting();
    const s = await prisma.setting.update({ where: { id: 1 }, data });
    emitCatalogUpdate("settings:update");
    res.json({ code: s.code, percent: s.percent });
  })
);

export default router;
