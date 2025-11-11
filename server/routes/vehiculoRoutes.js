// routes/vehiculos.js
const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === OBTENER TODOS LOS VEHÍCULOS ===
router.get("/", auth, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, numero_interno, patente, kilometro 
      FROM vehiculos 
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /vehiculos:", err);
    res.status(500).json({ message: "Error al obtener vehículos" });
  }
});

// === CREAR NUEVO VEHÍCULO ===
router.post("/", auth, async (req, res) => {
  const { numero_interno, patente, kilometro } = req.body || {};

  if (!numero_interno?.trim() || !patente?.trim())
    return res.status(400).json({ message: "Campos obligatorios faltantes" });

  try {
    const [result] = await db.query(
      `
      INSERT INTO vehiculos (numero_interno, patente, kilometro)
      VALUES (?, ?, ?)
    `,
      [numero_interno.trim(), patente.trim().toUpperCase(), kilometro || 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("❌ Error POST /vehiculos:", err);
    res.status(500).json({ message: "Error al crear vehículo" });
  }
});

// === ACTUALIZAR VEHÍCULO ===
router.put("/:id", auth, async (req, res) => {
  const { numero_interno, patente, kilometro } = req.body || {};
  if (!numero_interno?.trim() || !patente?.trim())
    return res.status(400).json({ message: "Campos obligatorios faltantes" });

  try {
    const [result] = await db.query(
      `
      UPDATE vehiculos 
      SET numero_interno=?, patente=?, kilometro=? 
      WHERE id=?
    `,
      [
        numero_interno.trim(),
        patente.trim().toUpperCase(),
        kilometro || 0,
        req.params.id,
      ]
    );

    if (!result.affectedRows)
      return res.status(404).json({ message: "Vehículo no encontrado" });

    res.json({ ok: true, updated: result.changedRows });
  } catch (err) {
    console.error("❌ Error PUT /vehiculos/:id:", err);
    res.status(500).json({ message: "Error al actualizar vehículo" });
  }
});

// === ELIMINAR VEHÍCULO (con validación de uso) ===
router.delete("/:id", auth, async (req, res) => {
  const vehiculoId = req.params.id;

  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS total FROM inspecciones WHERE vehiculo_id = ?",
      [vehiculoId]
    );
    const enUso = rows[0]?.total > 0;

    if (enUso) {
      return res.status(400).json({
        message:
          "No se puede eliminar este vehículo porque está asociado a reportes o inspecciones.",
      });
    }

    const [result] = await db.query("DELETE FROM vehiculos WHERE id=?", [
      vehiculoId,
    ]);

    if (!result.affectedRows)
      return res.status(404).json({ message: "Vehículo no encontrado" });

    res.json({ ok: true, message: "Vehículo eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error DELETE /vehiculos/:id:", err);
    res.status(500).json({ message: "Error al eliminar vehículo" });
  }
});

module.exports = router;
