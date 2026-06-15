import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ah } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const [productCount, activeProductCount, categoryCount, orders] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { active: true } }),
        prisma.category.count(),
        prisma.order.findMany({
          select: { total: true, paymentStatus: true, status: true, createdAt: true },
        }),
      ]);

    const orderCount = orders.length;
    const revenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((s, o) => s + o.total, 0);

    res.json({ productCount, activeProductCount, categoryCount, orderCount, revenue });
  })
);

export default router;
