const { db } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

// =============================================
// LISTAR VECINOS (usuarios con rol='vecino')
// =============================================
async function getVecinos(req, res) {
  try {
    const sql = `
      SELECT 
        id, 
        username,
        nombre, 
        rut, 
        telefono, 
        direccion, 
        correo,
        saldo_actual,
        qr_token,
        qr_url,
        activo
      FROM usuarios
      WHERE LOWER(rol) = 'vecino'
      ORDER BY nombre ASC;
    `;

    const result = await db.query(sql);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error getVecinos:", err);
    res.status(500).json({ error: "Error al obtener vecinos" });
  }
}

// =============================================
// ACTUALIZAR SALDO
// =============================================
async function updateSaldo(req, res) {
  try {
    const { id } = req.params;
    const { monto } = req.body;

    if (monto === undefined || monto === null) {
      return res.status(400).json({ error: "Monto requerido" });
    }

    // Verificar que el usuario existe y es vecino
    const checkSql = `
      SELECT id 
      FROM usuarios 
      WHERE id = $1 AND LOWER(rol) = 'vecino'
      LIMIT 1;
    `;
    
    const checkResult = await db.query(checkSql, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Vecino no encontrado" });
    }

    // Actualizar saldo
    const sql = `
      UPDATE usuarios
      SET saldo_actual = $1
      WHERE id = $2
      RETURNING 
        id, nombre, rut, telefono, direccion, correo,
        saldo_actual, qr_token, qr_url;
    `;

    const result = await db.query(sql, [Number(monto), id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updateSaldo:", err);
    res.status(500).json({ error: "Error al actualizar saldo" });
  }
}

// =============================================
// REGENERAR QR
// =============================================
async function regenerarQR(req, res) {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe y es vecino
    const checkSql = `
      SELECT id 
      FROM usuarios 
      WHERE id = $1 AND LOWER(rol) = 'vecino'
      LIMIT 1;
    `;
    
    const checkResult = await db.query(checkSql, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Vecino no encontrado" });
    }

    // Generar nuevo token único
    const qr_token = uuidv4();
    const qrData = `caja-vecina://${qr_token}`;

    // Generar QR como Data URL (base64)
    const qr_url = await QRCode.toDataURL(qrData);

    // Actualizar en la base de datos
    const sql = `
      UPDATE usuarios
      SET qr_token = $1,
          qr_url = $2
      WHERE id = $3
      RETURNING 
        id, nombre, rut, telefono, direccion, correo,
        saldo_actual, qr_token, qr_url;
    `;

    const result = await db.query(sql, [qr_token, qr_url, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error regenerarQR:", err);
    res.status(500).json({ error: "Error al regenerar QR" });
  }
}

module.exports = {
  getVecinos,
  updateSaldo,
  regenerarQR,
};