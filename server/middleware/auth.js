const { verifyToken } = require("../config/jwt");

function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      message: "No autorizado. Token no enviado.",
    });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object") {
      return res
        .status(401)
        .json({ message: "Token inválido: formato no reconocido." });
    }

    // Validación estructural
    if (!decoded.id || !decoded.rol) {
      return res.status(401).json({
        message: "Token inválido: datos incompletos.",
      });
    }

    // Normalizar rol (Conductor, Administrador, Usuario, etc.)
    const cleanRol =
      typeof decoded.rol === "string"
        ? decoded.rol.trim().charAt(0).toUpperCase() +
          decoded.rol.trim().slice(1).toLowerCase()
        : "Desconocido";

    req.user = {
      id: Number(decoded.id),
      username: decoded.username || "",
      nombre: decoded.nombre || "",
      rol: cleanRol,
    };

    return next();
  } catch (err) {
    const msg = err?.message || "Error al validar token";

    if (msg.includes("expired")) {
      return res.status(401).json({ message: "Token expirado." });
    }

    console.error("❌ Error JWT:", msg);
    return res.status(401).json({
      message: "Token inválido o manipulado.",
    });
  }
}

module.exports =  auth;
