// routes/mantencionesPdfRoutes.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/:id/pdf", auth, async (req, res) => {
  const { id } = req.params;

  try {
    /* ================= CONSULTA PRINCIPAL ================= */
    const { rows: rowsMant } = await db.query(
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

    if (!rowsMant.length) {
      return res.status(404).json({ error: "Mantención no encontrada" });
    }

    const data = rowsMant[0];

    /* ================= DETALLE ================= */
    const { rows: items } = await db.query(
      `
      SELECT item, tipo, cantidad, costo_unitario,
             cantidad * costo_unitario AS subtotal
      FROM mantencion_items
      WHERE mantencion_id = $1
      `,
      [id]
    );

    /* ================= CONFIG PDF ================= */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=mantencion_${id}.pdf`
    );

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 40, right: 40 },
      bufferPages: true
    });

    doc.pipe(res);

    /* ================= LOGO ================= */
    const logoPath = path.join(__dirname, "../public/logo.png");

    /* ================= QR ================= */
    const qrURL = `https://curacavi-frontend.onrender.com/mantenciones/${id}`;
    const qrDataURL = await QRCode.toDataURL(qrURL);

    /* ================= HEADER ================= */
    const drawHeader = (pageNum, totalPages) => {
      const L = doc.page.margins.left;

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, L, 15, { width: 80 });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .text("MUNICIPALIDAD DE CURACAVÍ", L + 100, 25)
        .fontSize(10)
        .fillColor("#000")
        .text("Dirección de Operaciones — Departamento de Movilización", L + 100, 42);

      doc
        .moveTo(L, 70)
        .lineTo(550, 70)
        .stroke("#003366");

      doc.fontSize(9)
        .fillColor("#666")
        .text(`Página ${pageNum} de ${totalPages}`, L, 80);
    };

    /* ================= PRIMERA PÁGINA ================= */
    drawHeader(1, 1);

    const L = doc.page.margins.left;

    /* ===== DATOS GENERALES ===== */
    doc.moveDown(3);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#003366").text("Datos Generales");
    doc.moveDown(0.5).font("Helvetica").fontSize(10).fillColor("#000");

    doc.text(`ID Mantención: ${id}`);
    doc.text(`Vehículo: ${data.vehiculo} (${data.numero_interno})`);
    doc.text(`Tipo: ${data.tipo}`);
    doc.text(`Responsable: ${data.responsable || "Sin asignar"}`);
    doc.text(
      `Fecha: ${new Date(data.fecha).toLocaleString("es-CL", {
        dateStyle: "short",
        timeStyle: "short",
      })}`
    );
    doc.text(`Costo total: $${Number(data.costo).toLocaleString("es-CL")}`);

    /* ===== QR CODE ===== */
    doc.image(qrDataURL, 450, 95, { width: 90 });

    /* ===== OBSERVACIONES ===== */
    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#003366").text("Observaciones");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10).fillColor("#000");
    doc.text(data.observacion || "Sin observaciones registradas.", { width: 450 });

    /* ===== DETALLE ===== */
    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#003366").text("Detalle de Tareas y Repuestos");
    doc.moveDown(0.5);

    const tableX = L;
    let tableY = doc.y;

    const colWidths = [160, 70, 60, 80, 80];
    const rowHeight = 18;

    /* HEADER TABLA */
    doc.rect(tableX, tableY, colWidths.reduce((a,b)=>a+b), rowHeight)
       .fill("#003366");
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(10);

    let xx = tableX;
    ["Ítem", "Tipo", "Cant.", "Unitario", "Subtotal"].forEach((h, i) => {
      doc.text(h, xx + 5, tableY + 4);
      xx += colWidths[i];
    });

    tableY += rowHeight;
    doc.font("Helvetica").fontSize(9).fillColor("#000");

    let total = 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];

      if (tableY > 720) {
        doc.addPage();
        tableY = 120;
      }

      const bg = i % 2 === 0 ? "#F8F8F8" : "#FFFFFF";
      doc.rect(tableX, tableY, colWidths.reduce((a,b)=>a+b), rowHeight)
         .fill(bg)
         .stroke("#DDD");

      let cx = tableX;
      doc.fillColor("#000");
      doc.text(it.item, cx + 5, tableY + 4, { width: colWidths[0] - 10 });
      cx += colWidths[0];
      doc.text(it.tipo, cx + 5, tableY + 4);
      cx += colWidths[1];
      doc.text(String(it.cantidad), cx + 5, tableY + 4);
      cx += colWidths[2];
      doc.text(`$${Number(it.costo_unitario).toLocaleString("es-CL")}`, cx + 5, tableY + 4);
      cx += colWidths[3];
      doc.text(`$${Number(it.subtotal).toLocaleString("es-CL")}`, cx + 5, tableY + 4);

      total += Number(it.subtotal);
      tableY += rowHeight;
    }

    doc.moveDown(1);
    doc.font("Helvetica-Bold").text(`TOTAL: $${total.toLocaleString("es-CL")}`, tableX + 300);

    /* ========== FIRMAS ========== */
    doc.moveDown(3);
    doc.text("_____________________________", L);
    doc.text("Firma Responsable", L + 10);

    doc.text("_____________________________", L + 250, doc.y - 12);
    doc.text("Supervisor", L + 260);

    /* ====== PAGINACIÓN ====== */
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      drawHeader(i - pages.start + 1, pages.count);
    }

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

module.exports = router;
