// ================== app.js (Render + Local) ==================
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
  process.env.LOCAL_CLIENT_APP,       // http://localhost:5173
  process.env.REMOTE_CLIENT_APP,      // https://gestor-municipal-curacavi-frontend.onrender.com
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://gestor-municipal-curacavi-frontend.onrender.com",
].filter(Boolean);

// === APP EXPRESS ===
const app = express();

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
    origin: (origin, callback) => {
      if (!origin || allowedDomains.includes(origin)) return callback(null, true);
      console.warn("❌ CORS bloqueado para:", origin);
      callback(new Error("CORS no permitido: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// === PREFLIGHT ===
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res.sendStatus(204);
  }
  next();
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

// === HEALTHCHECK ===
app.get("/", (_, res) => {
  res.json({
    ok: true,
    api: "Gestor Municipal API",
    env: NODE_ENV,
    db: process.env.DB_NAME,
    client: isProd
      ? process.env.REMOTE_CLIENT_APP
      : process.env.LOCAL_CLIENT_APP,
    server: isProd
      ? process.env.REMOTE_SERVER_API
      : process.env.LOCAL_SERVER_API,
    time: new Date().toISOString(),
  });
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
