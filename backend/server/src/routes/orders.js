import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ah } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Admin-only. Empty until the checkout flow ships (next phase).
router.get(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    res.json(orders);
  })
);

export default router;
