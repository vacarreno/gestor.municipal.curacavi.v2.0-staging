// routes/usuarioRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db } = require("../config/db");
const auth = require("../middleware/auth");

const router = express.Router();

/* ============================================================
   ============ CONFIG SUBIDA DE FOTOS (MULTER)
   ============================================================ */

// En producción usamos el disco persistente de Render
const uploadDir =
  process.env.NODE_ENV === "production"
    ? "/var/data/uploads"
    : path.join(__dirname, "..", "uploads");

// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✔ Carpeta creada:", uploadDir);
}

// Storage Multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const clean = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + clean);
  }
});

const upload = multer({ storage });

// Fix BASE_URL seguro
const BASE = process.env.BASE_URL || "https://curacavi-backend.onrender.com";

/* ============================================================
   =============== LISTAR TODOS LOS USUARIOS ===================
   ============================================================ */
router.get("/", auth, async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, username, nombre, correo, rol, activo,
        rut, direccion, telefono, licencia, departamento, foto
      FROM usuarios
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error GET /usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

/* ============================================================
   ================= SUBIR FOTO PERFIL =========================
   ============================================================ */
router.post("/upload-photo", auth, upload.single("foto"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se envió archivo" });
    }

    console.log("=== DEBUG SUBIDA FOTO ===");
    console.log("BASE_URL:", BASE);
    console.log("UPLOAD DIR:", uploadDir);
    console.log("FILENAME:", req.file.filename);

    const url = `${BASE}/uploads/${req.file.filename}`;

    await db.query(
      "UPDATE usuarios SET foto = $1 WHERE id = $2",
      [url, req.user.id]
    );

    res.json({ url });
  } catch (err) {
    console.error("❌ Error subiendo foto:", err);
    res.status(500).json({ message: "Error al subir la foto" });
  }
});

/* ============================================================
   ==================== CAMBIO DE CONTRASEÑA ===================
   ============================================================ */
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Datos incompletos." });
    }

    const result = await db.query(
      "SELECT password_hash FROM usuarios WHERE id = $1",
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Contraseña actual incorrecta." });
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await db.query(
      "UPDATE usuarios SET password_hash = $1 WHERE id = $2",
      [hash, req.user.id]
    );

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    console.error("❌ Error POST /usuarios/change-password:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

/* ============================================================
   ==================== RESTO DEL CRUD =========================
   ============================================================ */

router.get("/conductores", auth, async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, username, nombre, correo, rol, activo,
        rut, direccion, telefono, licencia, departamento, foto
      FROM usuarios
      WHERE LOWER(rol) = 'conductor' AND activo = true
      ORDER BY nombre ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error GET /usuarios/conductores:", err);
    res.status(500).json({ message: "Error al obtener conductores" });
  }
});

router.post("/", auth, async (req, res) => {
  const {
    username, nombre, correo, rut, direccion,
    telefono, licencia, departamento, rol, password
  } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña requeridos" });
  }

  try {
    const exists = await db.query(
      "SELECT id FROM usuarios WHERE username=$1 LIMIT 1",
      [username.trim()]
    );

    if (exists.rows.length) {
      return res.status(409).json({ message: "El usuario ya existe" });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `
      INSERT INTO usuarios (
        username, nombre, correo, rut, direccion, telefono,
        licencia, departamento, rol, password_hash, activo, foto
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,NULL)
      RETURNING id
      `,
      [
        username.trim(),
        nombre || "",
        correo || "",
        rut || "",
        direccion || "",
        telefono || "",
        licencia || "",
        departamento || "Municipalidad",
        rol || "Usuario",
        hash
      ]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Error POST /usuarios:", err);
    res.status(500).json({ message: "Error al crear usuario" });
  }
});

router.put("/:id", auth, async (req, res) => {
  const {
    nombre, correo, rut, direccion, telefono,
    licencia, departamento, rol, activo
  } = req.body || {};

  try {
    const exists = await db.query(
      "SELECT id FROM usuarios WHERE id=$1",
      [req.params.id]
    );

    if (!exists.rows.length) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await db.query(
      `
      UPDATE usuarios SET
        nombre=$1, correo=$2, rut=$3, direccion=$4,
        telefono=$5, licencia=$6, departamento=$7,
        rol=$8, activo=$9
      WHERE id=$10
      `,
      [
        nombre || "",
        correo || "",
        rut || "",
        direccion || "",
        telefono || "",
        licencia || "",
        departamento || "Municipalidad",
        rol || "Usuario",
        Boolean(activo),
        req.params.id
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PUT /usuarios/:id:", err);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const exists = await db.query(
      "SELECT id FROM usuarios WHERE id=$1",
      [req.params.id]
    );

    if (!exists.rows.length) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await db.query("DELETE FROM usuarios WHERE id=$1", [req.params.id]);

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error DELETE /usuarios/:id:", err);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
});

/* ============================================================
   === CAMBIO DE CONTRASEÑA PARA USUARIOS ADMINISTRADOS =======
   ============================================================ */
// *** CORREGIDO: EL FRONTEND USA PUT, NO POST ***
router.put("/:id/password", auth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { id } = req.params;

    if (!newPassword) {
      return res.status(400).json({ message: "Nueva contraseña requerida." });
    }

    const exists = await db.query(
      "SELECT id FROM usuarios WHERE id=$1",
      [id]
    );

    if (!exists.rows.length) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const hash = await bcrypt.hash(newPassword, 12);

    await db.query(
      "UPDATE usuarios SET password_hash=$1 WHERE id=$2",
      [hash, id]
    );

    res.json({ message: "Contraseña actualizada correctamente." });

  } catch (err) {
    console.error("❌ Error PUT /usuarios/:id/password:", err);
    res.status(500).json({ message: "Error interno" });
  }
});


module.exports = router;
