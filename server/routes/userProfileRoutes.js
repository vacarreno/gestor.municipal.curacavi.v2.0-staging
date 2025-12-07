const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db } = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

// === DIRECTORIO ABSOLUTO SEGURO PARA RENDER ===
const uploadDir = path.join(__dirname, "..", "uploads");

// Crear carpeta si no existe (Render permite creación dentro del runtime)
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

// ======================================
// ========= SUBIR FOTO PERFIL ==========
// ======================================
router.post("/upload-photo", auth, upload.single("foto"), async (req, res) => {
  try {
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
    console.log("REQ FILE =>", req.file);
    console.log("REQ BODY =>", req.body);

    console.error("❌ Error subiendo foto:", err);
    res.status(500).json({ error: "Error interno al subir foto" });
  }
});

module.exports = router;
