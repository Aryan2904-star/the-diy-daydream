import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ah } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { emitCatalogUpdate } from "../lib/socket.js";

const router = Router();

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Public — frontend builds its filter chips from this.
router.get(
  "/",
  ah(async (req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json(categories);
  })
);

router.post(
  "/",
  requireAuth,
  ah(async (req, res) => {
    const { name, emoji, tint, sortOrder } = req.body || {};
    if (!name) return res.status(400).json({ error: "Name required" });
    try {
      const cat = await prisma.category.create({
        data: {
          name,
          slug: slugify(name),
          emoji: emoji || null,
          tint: tint || "#f7eaee",
          sortOrder: Number(sortOrder) || 0,
        },
      });
      emitCatalogUpdate("category:create");
      res.status(201).json(cat);
    } catch (e) {
      if (e.code === "P2002")
        return res.status(409).json({ error: "A category with this name already exists" });
      throw e;
    }
  })
);

router.put(
  "/:id",
  requireAuth,
  ah(async (req, res) => {
    const { name, emoji, tint, sortOrder } = req.body || {};
    const data = {};
    if (name !== undefined) {
      data.name = name;
      data.slug = slugify(name);
    }
    if (emoji !== undefined) data.emoji = emoji || null;
    if (tint !== undefined) data.tint = tint;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
    try {
      const cat = await prisma.category.update({
        where: { id: req.params.id },
        data,
      });
      emitCatalogUpdate("category:update");
      res.json(cat);
    } catch (e) {
      if (e.code === "P2025") return res.status(404).json({ error: "Category not found" });
      if (e.code === "P2002") return res.status(409).json({ error: "Duplicate name" });
      throw e;
    }
  })
);

router.delete(
  "/:id",
  requireAuth,
  ah(async (req, res) => {
    const count = await prisma.product.count({
      where: { categoryId: req.params.id },
    });
    if (count > 0)
      return res.status(409).json({
        error: `Cannot delete: ${count} product(s) still use this category`,
      });
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      emitCatalogUpdate("category:delete");
      res.json({ ok: true });
    } catch (e) {
      if (e.code === "P2025") return res.status(404).json({ error: "Category not found" });
      throw e;
    }
  })
);

export default router;
