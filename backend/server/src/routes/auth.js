import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { ah } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post(
  "/login",
  ah(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const admin = await prisma.adminUser.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  })
);

// Lets the admin SPA verify a stored token on load.
router.get("/me", requireAuth, (req, res) => {
  res.json({ admin: { id: req.admin.id, email: req.admin.email } });
});

export default router;
