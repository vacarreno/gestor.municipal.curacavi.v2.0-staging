import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../db.js";
import auth from "../middleware/auth.js";

const router = Router();

// ===== CONFIGURACIÓN MULTER =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  }
});

const upload = multer({ storage });

// ===== ENDPOINT: SUBIR FOTO DE PERFIL =====
router.post("/upload-photo", auth, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió archivo." });
    }

    const url = `${process.env.BASE_URL}/uploads/${req.file.filename}`;

    await db.query(
      "UPDATE usuarios SET foto = ? WHERE id = ?",
      [url, req.user.id]
    );

    res.json({ url });
  } catch (err) {
    console.error("Error subiendo foto:", err);
    res.status(500).json({ error: "Error interno al subir la foto." });
  }
});

export default router;
