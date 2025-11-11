// routes/inspecciones.js
const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === OBTENER INSPECCIONES (solo propias si es Conductor) ===
router.get("/", auth, async (req, res) => {
  try {
    const user = req.user;
    const isConductor = user.rol?.toLowerCase() === "conductor";

    let sql = `
      SELECT 
        i.id,
        i.created_at AS fecha,
        u.nombre AS conductor_nombre,
        u.id AS usuario_id,
        v.patente AS vehiculo_patente,
        v.id AS vehiculo_id,
        COALESCE(i.estado, 'OK') AS estado,
        i.observacion
      FROM inspecciones i
      JOIN usuarios u ON u.id = i.usuario_id
      JOIN vehiculos v ON v.id = i.vehiculo_id
      WHERE LOWER(COALESCE(u.rol, '')) = 'conductor'
    `;

    const params = [];
    if (isConductor) {
      sql += " AND i.usuario_id = ? ";
      params.push(user.id);
    }

    sql += " ORDER BY i.id DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /inspecciones:", err);
    res.status(500).json({ message: "Error al obtener inspecciones" });
  }
});

// === CREAR INSPECCIÓN ===
router.post("/", auth, async (req, res) => {
  const user = req.user;
  const isConductor = user.rol?.toLowerCase() === "conductor";
  const { usuario_id, vehiculo_id, observacion, items, foto } = req.body;

  if (!vehiculo_id)
    return res.status(400).json({ message: "vehiculo_id es obligatorio" });

  if (isConductor && Number(usuario_id) !== Number(user.id))
    return res.status(403).json({
      message:
        "Acción no permitida. Los conductores solo pueden registrar inspecciones propias.",
    });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO inspecciones (usuario_id, vehiculo_id, observacion, estado, foto) VALUES (?,?,?,?,?)",
      [usuario_id, vehiculo_id, observacion || "", "OK", foto || null]
    );

    const inspeccionId = result.insertId;
    const rows = [];

    if (items && typeof items === "object") {
      for (const [key, val] of Object.entries(items)) {
        rows.push([
          inspeccionId,
          key,
          val?.existe === "NO" ? "NO" : "SI",
          ["Bueno", "Regular", "Malo"].includes(val?.estado)
            ? val.estado
            : "Bueno",
          (val?.obs || "").slice(0, 255),
        ]);
      }
    }

    if (rows.length) {
      await conn.query(
        "INSERT INTO inspeccion_items (inspeccion_id, item_key, existe, estado, obs) VALUES ?",
        [rows]
      );
    }

    await conn.commit();
    res.status(201).json({ id: inspeccionId, items: rows.length || 0 });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error POST /inspecciones:", err);
    res.status(500).json({ message: "Error al crear inspección" });
  } finally {
    conn.release();
  }
});

// === OBTENER ÍTEMS DE UNA INSPECCIÓN ===
router.get("/:id/items", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user;
    const isConductor = user.rol?.toLowerCase() === "conductor";

    const [checkRows] = await db.query(
      isConductor
        ? "SELECT usuario_id FROM inspecciones WHERE id=? AND usuario_id=?"
        : "SELECT usuario_id FROM inspecciones WHERE id=?",
      isConductor ? [id, user.id] : [id]
    );

    if (!checkRows.length)
      return res
        .status(403)
        .json({ message: "No tiene permiso para ver esta inspección." });

    const [rows] = await db.query(
      "SELECT item_key, existe, estado, obs FROM inspeccion_items WHERE inspeccion_id=?",
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /inspecciones/:id/items:", err);
    res.status(500).json({ message: "Error al obtener ítems" });
  }
});

module.exports = router;
