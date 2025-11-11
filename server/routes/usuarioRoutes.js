// routes/usuarios.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === OBTENER TODOS LOS USUARIOS ===
router.get("/", auth, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id, username, nombre, correo, rol, activo,
        rut, direccion, telefono, licencia, departamento
      FROM usuarios
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// === OBTENER CONDUCTORES ACTIVOS ===
router.get("/conductores", auth, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id, username, nombre, correo, rol, activo,
        rut, direccion, telefono, licencia, departamento
      FROM usuarios
      WHERE LOWER(rol)='conductor' AND activo=1
      ORDER BY nombre ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /usuarios/conductores:", err);
    res.status(500).json({ message: "Error al obtener conductores" });
  }
});

// === CREAR NUEVO USUARIO ===
router.post("/", auth, async (req, res) => {
  const {
    username,
    nombre,
    correo,
    rut,
    direccion,
    telefono,
    licencia,
    departamento,
    rol,
    password,
  } = req.body || {};

  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Usuario y contraseña son obligatorios" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `
      INSERT INTO usuarios (
        username, nombre, correo, rut, direccion, telefono, licencia, departamento,
        rol, password_hash, activo
      ) VALUES (?,?,?,?,?,?,?,?,?,?,1)
    `,
      [
        username,
        nombre || "",
        correo || "",
        rut || "",
        direccion || "",
        telefono || "",
        licencia || "",
        departamento || "Municipalidad",
        rol || "Usuario",
        hash,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("❌ Error POST /usuarios:", err);
    res.status(500).json({ message: "Error al crear usuario" });
  }
});

// === ACTUALIZAR DATOS DEL USUARIO ===
router.put("/:id", auth, async (req, res) => {
  const {
    nombre,
    correo,
    rut,
    direccion,
    telefono,
    licencia,
    departamento,
    rol,
    activo,
  } = req.body || {};

  try {
    await db.query(
      `
      UPDATE usuarios SET
        nombre=?,
        correo=?,
        rut=?,
        direccion=?,
        telefono=?,
        licencia=?,
        departamento=?,
        rol=?,
        activo=?
      WHERE id=?
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
        activo ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PUT /usuarios/:id:", err);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
});

// === CAMBIAR CONTRASEÑA ===
router.put("/:id/password", auth, async (req, res) => {
  const { password } = req.body || {};
  if (!password)
    return res.status(400).json({ message: "Contraseña requerida" });

  try {
    const hash = await bcrypt.hash(password, 10);
    await db.query("UPDATE usuarios SET password_hash=? WHERE id=?", [
      hash,
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PUT /usuarios/:id/password:", err);
    res.status(500).json({ message: "Error al actualizar contraseña" });
  }
});

// === ELIMINAR USUARIO ===
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM usuarios WHERE id=?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error DELETE /usuarios/:id:", err);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
});

module.exports = router;
