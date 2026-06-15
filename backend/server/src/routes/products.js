import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { ah } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  uploadImage,
  deleteImage,
  isCloudinaryConfigured,
} from "../lib/cloudinary.js";
import { emitCatalogUpdate } from "../lib/socket.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// options arrive as a JSON string (multipart form) or an array (JSON body).
function parseOptions(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  return [];
}

function cleanOptions(opts) {
  return opts
    .map((o) => ({
      label: String(o.label || "").trim(),
      price: Math.round(Number(o.price)),
    }))
    .filter((o) => o.label && Number.isFinite(o.price) && o.price >= 0);
}

const toBool = (v) => v === true || v === "true";

// Public — frontend calls /api/products?active=true
router.get(
  "/",
  ah(async (req, res) => {
    const where = {};
    if (req.query.active === "true") where.active = true;
    const products = await prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { category: true },
    });
    res.json(products);
  })
);

router.post(
  "/",
  requireAuth,
  upload.single("image"),
  ah(async (req, res) => {
    const { name, desc, badge, categoryId, artFallback, active, sortOrder } =
      req.body;
    if (!name || !desc || !categoryId)
      return res
        .status(400)
        .json({ error: "name, desc and categoryId are required" });

    const options = cleanOptions(parseOptions(req.body.options));
    if (!options.length)
      return res
        .status(400)
        .json({ error: "At least one price option (label + price) is required" });

    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) return res.status(400).json({ error: "Invalid categoryId" });

    let imageUrl = null;
    let imagePublicId = null;
    if (req.file) {
      if (!isCloudinaryConfigured())
        return res.status(500).json({
          error: "Image upload not configured (set CLOUDINARY_* env vars)",
        });
      const result = await uploadImage(req.file.buffer);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const product = await prisma.product.create({
      data: {
        name,
        desc,
        badge: badge && badge !== "none" ? badge : null,
        categoryId,
        artFallback: artFallback || "gift",
        active: active === undefined ? true : toBool(active),
        sortOrder: Number(sortOrder) || 0,
        options,
        imageUrl,
        imagePublicId,
      },
      include: { category: true },
    });
    emitCatalogUpdate("product:create");
    res.status(201).json(product);
  })
);

router.put(
  "/:id",
  requireAuth,
  upload.single("image"),
  ah(async (req, res) => {
    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Product not found" });

    const { name, desc, badge, categoryId, artFallback, active, sortOrder } =
      req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (desc !== undefined) data.desc = desc;
    if (badge !== undefined) data.badge = badge && badge !== "none" ? badge : null;
    if (categoryId !== undefined) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) return res.status(400).json({ error: "Invalid categoryId" });
      data.categoryId = categoryId;
    }
    if (artFallback !== undefined) data.artFallback = artFallback || "gift";
    if (active !== undefined) data.active = toBool(active);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
    if (req.body.options !== undefined) {
      const options = cleanOptions(parseOptions(req.body.options));
      if (!options.length)
        return res.status(400).json({ error: "At least one price option required" });
      data.options = options;
    }
    if (req.file) {
      if (!isCloudinaryConfigured())
        return res.status(500).json({ error: "Image upload not configured" });
      const result = await uploadImage(req.file.buffer);
      data.imageUrl = result.secure_url;
      data.imagePublicId = result.public_id;
      if (existing.imagePublicId) await deleteImage(existing.imagePublicId);
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    });
    emitCatalogUpdate("product:update");
    res.json(product);
  })
);

router.delete(
  "/:id",
  requireAuth,
  ah(async (req, res) => {
    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Product not found" });
    await prisma.product.delete({ where: { id: req.params.id } });
    if (existing.imagePublicId) await deleteImage(existing.imagePublicId);
    emitCatalogUpdate("product:delete");
    res.json({ ok: true });
  })
);

export default router;
