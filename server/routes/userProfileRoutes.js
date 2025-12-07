const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db } = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// === DIRECTORIO ABSOLUTO ===
const uploadDir = path.join(__dirname, "..", "uploads");

// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// === STORAGE MULTER ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, unique);
  },
});

const upload = multer({ storage });

/* ======================================
   ========== SUBIR FOTO PERFIL ==========
   ====================================== */
router.post("/upload-photo", auth, upload.single("foto"), async (req, res) => {
  try {
    console.log("========== UPLOAD DEBUG ==========");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);
    console.log("===================================");

    if (!req.file) {
      return res.status(400).json({ error: "No se envió archivo." });
    }

    // URL pública correcta
    const fileUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;

    await db.query(
      "UPDATE usuarios SET foto = $1 WHERE id = $2",
      [fileUrl, req.user.id]
    );

    res.json({ url: fileUrl });

  } catch (err) {
    console.error("❌ Error subiendo foto:", err);
    res.status(500).json({ error: "Error interno al subir foto" });
  }
});

module.exports = router;
