// ================== app.js (Render + Local, PostgreSQL OK) ==================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
require("dotenv").config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// ========================================================
// ================= CONFIGURACIÓN BASE ===================
// ========================================================

const allowedDomains = ["https://curacavi-frontend.onrender.com"].filter(
  Boolean
);

const app = express();
app.set("trust proxy", 1);

// ========================================================
// =================== MIDDLEWARE CORE ====================
// ========================================================

// Logging
app.use(morgan(isProd ? "combined" : "dev"));

// Seguridad
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Compresión
app.use(compression());

// Rate Limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 2000,
    message: { error: "Demasiadas solicitudes, intente más tarde" },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Body Parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS Controlado
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedDomains.includes(origin)) return callback(null, true);

      console.warn("❌ CORS bloqueado:", origin);
      return callback(new Error("CORS no permitido"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// PREFLIGHT (Express v5)
app.options(/.*/, (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return res.sendStatus(204);
});

// Debug Local
if (!isProd) {
  app.use((req, _, next) => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ========================================================
// ====================== ROUTER MAP ======================
// ========================================================
// Ordenado por categoría / módulo para evitar colisiones

// --- Autenticación / Seguridad ---
app.use("/auth", require("./routes/authRoutes"));

// --- Gestión Usuarios ---
app.use("/usuarios", require("./routes/usuarioRoutes"));
app.use("/conductores", require("./routes/conductorRoutes"));

// --- Flota Vehicular ---
app.use("/vehiculos", require("./routes/vehiculoRoutes"));
app.use("/inspecciones", require("./routes/inspeccionRoutes"));

// --- Mantenciones (específico → general) ---
app.use("/mantenciones", require("./routes/mantencionesPdfRoutes"));
app.use("/mantenciones", require("./routes/mantencionesRoutes"));

// --- Reportes ---
app.use("/reportes", require("./routes/reportesRoutes"));

// ========================================================
// ====================== HEALTHCHECK =====================
// ========================================================
app.get("/", (_, res) => {
  res.json({
    ok: true,
    api: "Gestor Municipal API",
    env: NODE_ENV,
    db: process.env.DB_NAME,
    time: new Date().toISOString(),
  });
});

// ========================================================
// ======================= 404 GLOBAL =====================
// ========================================================
app.use(/.*/, (_, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ========================================================
// =================== INICIO SERVIDOR ====================
// ========================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
  console.log(`🌐 Entorno: ${NODE_ENV}`);
  console.log(`🌍 CORS permitido: ${allowedDomains.join(", ")}`);
  console.log(`✅ Base de datos: ${process.env.DB_NAME}`);
});

module.exports = app;
