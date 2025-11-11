// routes/usuarios.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === Obtener todos los usuarios ===
router.get("/", auth, async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, nombre, correo, rol, activo FROM usuarios ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// === Crear usuario ===
router.post("/", auth, async (req, res) => {
  const { username, nombre, correo, rol, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Usuario y contraseña obligatorios" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO usuarios (username, nombre, correo, rol, password_hash, activo) VALUES (?, ?, ?, ?, ?, 1)",
      [username, nombre, correo, rol, hash]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("❌ Error POST /usuarios:", err);
    res.status(500).json({ message: "Error al crear usuario" });
  }
});

// === Actualizar datos usuario ===
router.put("/:id", auth, async (req, res) => {
  const { nombre, correo, rol, activo } = req.body;
  try {
    await db.query(
      "UPDATE usuarios SET nombre=?, correo=?, rol=?, activo=? WHERE id=?",
      [nombre, correo, rol, activo ? 1 : 0, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PUT /usuarios/:id:", err);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
});

// === Actualizar contraseña ===
router.put("/:id/password", auth, async (req, res) => {
  const { password } = req.body;
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

// === Eliminar usuario ===
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
