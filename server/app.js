// ================== app.js (Render + Local, PostgreSQL OK) ==================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
require("dotenv").config();
const { db } = require("./config/db");


const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// === DOMINIOS PERMITIDOS ===
const allowedDomains = [
  "https://curacavi-frontend.onrender.com",
].filter(Boolean);

// === APP EXPRESS ===
const app = express();
app.set("trust proxy", 1);
// === LOGGING ===
app.use(morgan(isProd ? "combined" : "dev"));

// === SEGURIDAD ===
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// === COMPRESIÓN ===
app.use(compression());

// === RATE LIMIT ===
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 2000,
    message: { error: "Demasiadas solicitudes, intente más tarde" },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// === BODY PARSERS ===
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// === CORS ===
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / SSR
      if (allowedDomains.includes(origin)) {
        return callback(null, true);
      }
      console.warn("❌ CORS bloqueado:", origin);
      return callback(new Error("CORS no permitido"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// === PREFLIGHT EXPRESS 5 ===
app.options(/.*/, (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return res.sendStatus(204);
});



// === DEBUG LOCAL ===
if (!isProd) {
  app.use((req, _, next) => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// === RUTAS ===
app.use("/auth", require("./routes/authRoutes"));
app.use("/usuarios", require("./routes/usuarioRoutes"));
app.use("/vehiculos", require("./routes/vehiculoRoutes"));
app.use("/conductores", require("./routes/conductorRoutes"));
app.use("/inspecciones", require("./routes/inspeccionRoutes"));
app.use("/reportes", require("./routes/reportesRoutes"));
app.use("/mantenciones", require("./routes/mantencionesRoutes"));
app.use("/mantenciones/pdf", require("./routes/mantencionesPdfRoutes"));

// === HEALTHCHECK ===
app.get("/", (_, res) => {
  res.json({
    ok: true,
    api: "Gestor Municipal API",
    env: NODE_ENV,
    db: process.env.DB_NAME,
    time: new Date().toISOString(),
  });
});

// === CATCH-ALL (Express 5 OK) ===
app.use(/.*/, (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// === INICIO SERVIDOR ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
  console.log(`🌐 Entorno: ${NODE_ENV}`);
  console.log(`🌍 CORS permitido: ${allowedDomains.join(", ")}`);
  console.log(`✅ Base de datos: ${process.env.DB_NAME}`);
});

module.exports = app;
