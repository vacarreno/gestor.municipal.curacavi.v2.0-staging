// routes/mantencionesPdfRoutes.js
const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const crypto = require("crypto");
const { db } = require("../config/db");
const { authOptional } = require("../middleware/authOptional"); // NUEVO: Permite token por query

const router = express.Router();

/* ============================================================
   ============ GENERAR PDF DE MANTENCIÓN ======================
   ============================================================ */
router.get("/:id/pdf", authOptional, async (req, res) => {
  try {
    const { id } = req.params;

    /* ================= CONSULTA PRINCIPAL ================= */
    const { rows: mantRows } = await db.query(
      `
      SELECT 
        m.*, 
        v.patente AS vehiculo,
        v.numero_interno,
        u.nombre AS responsable
      FROM mantenciones m
      JOIN vehiculos v ON v.id = m.vehiculo_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.id = $1
      `,
      [id]
    );

    if (!mantRows.length)
      return res.status(404).send("Mantención no encontrada");

    const data = mantRows[0];

    /* ================= DETALLES ================= */
    const { rows: items } = await db.query(
      `
      SELECT 
        item, tipo, cantidad, costo_unitario,
        (cantidad * costo_unitario) AS subtotal
      FROM mantencion_items
      WHERE mantencion_id = $1
      `,
      [id]
    );

    /* ================= FOLIO ÚNICO ================= */
    const folio = crypto.randomBytes(8).toString("hex").toUpperCase();

    /* ================= HASH DE INTEGRIDAD ================= */
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ data, items }))
      .digest("hex")
      .substring(0, 20)
      .toUpperCase();

    /* ================= CONFIG PDF ================= */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=mantencion_${id}.pdf`
    );

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 40, right: 40 },
      bufferPages: true,
    });

    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo.png");

    /* ================= QR ================= */
    const qrTexto = `
FOLIO: ${folio}
Vehículo: ${data.vehiculo}
Fecha: ${new Date(data.fecha).toLocaleString("es-CL")}
Hash: ${hash}
    `.trim();

    const qrDataURL = await QRCode.toDataURL(qrTexto);

    /* ================= MARCA DE AGUA ================= */
    doc.save();
    doc.fontSize(60)
      .fillColor("#CCCCCC")
      .opacity(0.15)
      .text("MUNICIPALIDAD DE CURACAVÍ", 80, 280, {
        angle: 30,
      });
    doc.restore();

    /* ================= ENCABEZADO ================= */
    const drawHeader = (current, total) => {
      const L = doc.page.margins.left;

      // LOGO
      try {
        const fs = require("fs");
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, L, 20, { width: 70 });
        }
      } catch {}

      // TITULOS
      doc.font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .text("MUNICIPALIDAD DE CURACAVÍ", L + 90, 20)
        .fontSize(10)
        .fillColor("#000")
        .text(
          "Dirección de Operaciones — Departamento de Movilización",
          L + 90,
          38
        );

      // LÍNEA
      doc.moveTo(L, 60)
        .lineTo(doc.page.width - L, 60)
        .strokeColor("#003366")
        .stroke();

      doc.font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#003366")
        .text("INFORME DE MANTENCIÓN VEHICULAR", L, 75);

      // Paginación
      doc.font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(`Página ${current} de ${total}`, L, 95);

      // QR
      doc.image(qrDataURL, doc.page.width - 120, 20, { width: 80 });
    };

    /* ================= CONTENIDO ================= */
    drawHeader(1, 1);

    const L = doc.page.margins.left;

    // DATOS GENERALES
    doc.moveDown(3);
    doc.font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#003366")
      .text("Datos Generales", L);

    doc.font("Helvetica").fontSize(10).fillColor("#000").moveDown(1);

    doc.text(`Folio interno: ${folio}`);
    doc.text(`Vehículo: ${data.vehiculo} (${data.numero_interno})`);
    doc.text(`Tipo: ${data.tipo}`);
    doc.text(`Responsable: ${data.responsable || "Sin asignar"}`);
    doc.text(
      `Fecha: ${new Date(data.fecha).toLocaleString("es-CL", {
        dateStyle: "short",
        timeStyle: "short",
      })}`
    );
    doc.text(
      `Costo total: $${Number(data.costo || 0).toLocaleString("es-CL")}`
    );

    /* ================= OBSERVACIONES ================= */
    doc.moveDown(2);
    doc.font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#003366")
      .text("Observaciones", L);

    doc.font("Helvetica")
      .fontSize(10)
      .fillColor("#000")
      .moveDown(0.7)
      .text(data.observacion || "Sin observaciones registradas.", {
        width: 480,
      });

    /* ================= TABLA DETALLE ================= */
    doc.moveDown(2);

    if (items.length > 0) {
      doc.font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#003366")
        .text("Detalle de Tareas y Repuestos", L);

      doc.moveDown(1);

      const startX = L;
      const widths = [170, 70, 60, 80, 80];
      const rowH = 18;

      let y = doc.y;

      // HEADER TABLA
      doc.rect(startX, y, widths.reduce((a, b) => a + b), rowH)
        .fillAndStroke("#003366", "#003366");

      doc.fillColor("#FFF").font("Helvetica-Bold").fontSize(10);

      let x = startX;
      ["Ítem", "Tipo", "Cant.", "Unitario", "Subtotal"].forEach((h, i) => {
        doc.text(h, x + 5, y + 4, { width: widths[i] - 10 });
        x += widths[i];
      });

      y += rowH;

      doc.font("Helvetica").fontSize(9).fillColor("#000");

      let total = 0;

      items.forEach((it, idx) => {
        if (y > doc.page.height - 120) {
          doc.addPage();
          y = doc.page.margins.top + 40;
        }

        const bg = idx % 2 === 0 ? "#F2F2F2" : "#FFFFFF";

        doc.rect(startX, y, widths.reduce((a, b) => a + b), rowH)
          .fillAndStroke(bg, "#CCCCCC");

        let colX = startX;

        doc.text(it.item, colX + 5, y + 4, { width: widths[0] - 10 });
        colX += widths[0];

        doc.text(it.tipo, colX + 5, y + 4);
        colX += widths[1];

        doc.text(String(it.cantidad), colX + 5, y + 4);
        colX += widths[2];

        doc.text(
          `$${Number(it.costo_unitario).toLocaleString("es-CL")}`,
          colX + 5,
          y + 4
        );
        colX += widths[3];

        doc.text(
          `$${Number(it.subtotal).toLocaleString("es-CL")}`,
          colX + 5,
          y + 4
        );

        total += Number(it.subtotal);
        y += rowH;
      });

      doc.font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#000")
        .text(`TOTAL: $${total.toLocaleString("es-CL")}`, startX + 300, y + 12);

    } else {
      doc.text("Sin ítems registrados.", L);
    }

    /* ================= PIE – FOLIO & HASH ================= */
    doc.moveDown(3);
    doc.font("Helvetica-Bold")
      .fontSize(10)
      .text(`Folio interno: ${folio}`);
    doc.font("Helvetica")
      .fontSize(9)
      .text(`Hash de integridad: ${hash}`);
    doc.text("Documento generado automáticamente por Gestor Municipal Curacaví");

    /* ================= PAGINACIÓN REAL ================= */
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      drawHeader(i - pages.start + 1, pages.count);
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error PDF:", err);
    res.status(500).send("Error al generar PDF");
  }
});

module.exports = router;
