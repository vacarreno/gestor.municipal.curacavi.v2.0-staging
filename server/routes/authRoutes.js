// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === LOGIN ===
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Usuario y contraseña requeridos" });

    const [rows] = await db.query(
      "SELECT id, username, nombre, correo, rol, password_hash FROM usuarios WHERE username = ? LIMIT 1",
      [username]
    );

    if (!rows.length)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("❌ Error en /auth/login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// === PERFIL DE USUARIO ===
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
