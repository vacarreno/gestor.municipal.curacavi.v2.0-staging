// routes/mantencionesRoutes.js
const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

/* ============================================================
   ============ LISTAR TODAS LAS MANTENCIONES =================
   ============================================================ */
router.get("/", auth, async (req, res) => {
  try {
    // 1️⃣ Mantenciones principales
    const mantResult = await db.query(`
      SELECT 
        m.id, m.tipo, m.fecha, m.observacion, m.costo,
        m.vehiculo_id, m.usuario_id,
        v.patente AS vehiculo_patente, 
        v.numero_interno,
        u.nombre AS responsable
      FROM mantenciones m
      JOIN vehiculos v ON v.id = m.vehiculo_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      ORDER BY m.id DESC
    `);

    const mantenciones = mantResult.rows;

    // 2️⃣ Traer TODOS los ítems
    const itemsResult = await db.query(`
      SELECT 
        id, mantencion_id, item, tipo, cantidad, costo_unitario
      FROM mantencion_items
      ORDER BY id ASC
    `);

    const items = itemsResult.rows;

    // 3️⃣ Asociar ítems a cada mantención
    mantenciones.forEach(m => {
      m.items = items.filter(i => i.mantencion_id === m.id);
    });

    res.json(mantenciones);

  } catch (err) {
    console.error("❌ Error listando mantenciones:", err);
    res.status(500).json({ message: "Error al listar mantenciones" });
  }
});

/* ============================================================
   ============ OBTENER DETALLE DE UNA MANTENCIÓN =============
   ============================================================ */
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Cabecera completa
    const mantResult = await db.query(
      `
      SELECT 
        m.id, m.tipo, m.fecha, m.observacion, m.costo,
        m.vehiculo_id, m.usuario_id,
        v.patente AS vehiculo_patente,
        v.numero_interno,
        u.nombre AS responsable
      FROM mantenciones m
      JOIN vehiculos v ON v.id = m.vehiculo_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.id = $1
      `,
      [id]
    );

    if (mantResult.rows.length === 0)
      return res.status(404).json({ message: "Mantención no encontrada" });

    const mantencion = mantResult.rows[0];

    // 2️⃣ Ítems asociados
    const itemsResult = await db.query(
      `
      SELECT id, mantencion_id, item, tipo, cantidad, costo_unitario
      FROM mantencion_items
      WHERE mantencion_id = $1
      ORDER BY id ASC
      `,
      [id]
    );

    mantencion.items = itemsResult.rows;

    res.json(mantencion);

  } catch (err) {
    console.error("❌ Error obteniendo mantención:", err);
    res.status(500).json({ message: "Error al obtener mantención" });
  }
});

/* ============================================================
   ============ CREAR MANTENCIÓN (con ítems) ==================
   ============================================================ */
router.post("/", auth, async (req, res) => {
  const { vehiculo_id, usuario_id, tipo, observacion, costo, items = [] } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Insertar mantención
    const mantResult = await client.query(
      `
      INSERT INTO mantenciones 
      (vehiculo_id, usuario_id, tipo, observacion, costo, fecha)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
      `,
      [vehiculo_id, usuario_id || null, tipo, observacion || "", costo || 0]
    );

    const mantencionId = mantResult.rows[0].id;

    // 2️⃣ Insertar ítems por batch
    if (items.length > 0) {
      const values = [];
      const params = [];

      items.forEach((i, index) => {
        const base = index * 5;
        values.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
        );

        params.push(
          mantencionId,
          i.item,
          i.tipo || "Tarea",
          i.cantidad || 1,
          i.costo_unitario || 0
        );
      });

      await client.query(
        `
        INSERT INTO mantencion_items
        (mantencion_id, item, tipo, cantidad, costo_unitario)
        VALUES ${values.join(", ")}
        `,
        params
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      id: mantencionId,
      message: "Mantención creada correctamente",
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error creando mantención:", err);
    res.status(500).json({ message: "Error al crear mantención" });
  } finally {
    client.release();
  }
});

/* ============================================================
   ============ ACTUALIZAR MANTENCIÓN ==========================
   ============================================================ */
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { vehiculo_id, usuario_id, tipo, observacion, costo, items = [] } = req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Actualizar cabecera
    await client.query(
      `
      UPDATE mantenciones
      SET vehiculo_id=$1, usuario_id=$2, tipo=$3, observacion=$4, costo=$5
      WHERE id=$6
      `,
      [
        vehiculo_id,
        usuario_id || null,
        tipo,
        observacion || "",
        costo || 0,
        id,
      ]
    );

    // 2️⃣ Borrar ítems anteriores
    await client.query("DELETE FROM mantencion_items WHERE mantencion_id=$1", [id]);

    // 3️⃣ Registrar ítems nuevos
    if (items.length > 0) {
      const values = [];
      const params = [];

      items.forEach((i, index) => {
        const base = index * 5;
        values.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`
        );

        params.push(
          id,
          i.item,
          i.tipo || "Tarea",
          i.cantidad || 1,
          i.costo_unitario || 0
        );
      });

      await client.query(
        `
        INSERT INTO mantencion_items
        (mantencion_id, item, tipo, cantidad, costo_unitario)
        VALUES ${values.join(", ")}
        `,
        params
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Mantención actualizada correctamente" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error actualizando mantención:", err);
    res.status(500).json({ message: "Error al actualizar mantención" });
  } finally {
    client.release();
  }
});

/* ============================================================
   ============ ELIMINAR MANTENCIÓN ============================
   ============================================================ */
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM mantenciones WHERE id=$1", [id]);
    res.json({ message: "Mantención eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando mantención:", err);
    res.status(500).json({ message: "Error al eliminar mantención" });
  }
});

module.exports = router;
