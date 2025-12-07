// ================== app.js ==================
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
require("dotenv").config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

const allowedDomains = [
  "https://front-desarrollo.onrender.com",
  "http://localhost:5173",
].filter(Boolean);

const app = express();
app.set("trust proxy", 1);

// =================== MIDDLEWARE CORE ====================
app.use(morgan(isProd ? "combined" : "dev"));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // 🔥 IMPORTANTE
  })
);
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 300 : 2000,
    message: { error: "Demasiadas solicitudes, intente más tarde" },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ========================================================
// ======= SERVIR FOTOS ANTES DEL MIDDLEWARE CORS =========
// ========================================================
app.use(
  "/uploads",
  express.static(
    isProd
      ? "/var/data/uploads" // Render Disk persistente
      : path.join(__dirname, "uploads") // Carpeta local
  )
);
console.log(
  "📁 Servir /uploads desde:",
  isProd ? "/var/data/uploads" : path.join(__dirname, "uploads")
);

// =================== CORS ====================
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

app.options(/.*/, (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return res.sendStatus(204);
});

// ========================================================
// ====================== ROUTER MAP ======================
// ========================================================
app.use("/auth", require("./routes/authRoutes"));
app.use("/usuarios", require("./routes/usuarioRoutes"));
app.use("/conductores", require("./routes/conductorRoutes"));
app.use("/users", require("./routes/userProfileRoutes"));
app.use("/vehiculos", require("./routes/vehiculoRoutes"));
app.use("/inspecciones", require("./routes/inspeccionRoutes"));
app.use("/mantenciones", require("./routes/mantencionesPdfRoutes"));
app.use("/mantenciones", require("./routes/mantencionesRoutes"));
app.use("/reportes", require("./routes/reportesRoutes"));
app.use("/billetera", require("./routes/billeteraRoutes"));

// ========================================================
// ====================== HEALTHCHECK =====================
// ========================================================
app.get("/", (_, res) => {
  res.json({
    ok: true,
    api: "Gestor Municipal API",
    env: NODE_ENV,
    baseUrl: process.env.BASE_URL,
    db: process.env.DB_NAME,
    uploadsPath: isProd ? "/var/data/uploads" : path.join(__dirname, "uploads"),
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
// ==================== INICIO SERVIDOR ===================
// ========================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
  console.log(`🌐 Entorno: ${NODE_ENV}`);
  console.log(`🌍 CORS permitido: ${allowedDomains.join(", ")}`);
  console.log(
    `📸 Fotos desde: ${
      isProd ? "/var/data/uploads" : path.join(__dirname, "uploads")
    }`
  );
  console.log(`🌎 BASE_URL: ${process.env.BASE_URL}`);
  console.log(`✅ Base de datos: ${process.env.DB_NAME}`);
});

module.exports = app;
