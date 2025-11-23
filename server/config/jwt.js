const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// Normalizar Rol
function normalizeRol(rol) {
  if (!rol || typeof rol !== "string") return "Usuario";
  return rol.trim().toLowerCase(); // <-- SEGURO PARA FRONT Y BACK
}

// === Generar token ===
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      sub: user.id,
      username: user.username,
      nombre: user.nombre || "",
      rol: normalizeRol(user.rol),  // <-- FIX
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// === Validar token ===
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
