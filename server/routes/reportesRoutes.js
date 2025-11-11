// routes/pdfRoutes.js
const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const PDFDocument = require("pdfkit");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/inspeccion/:id/pdf", auth, async (req, res) => {
  const id = req.params.id;

  try {
    // === CONSULTA PRINCIPAL ===
    const [rows] = await db.query(
      `
      SELECT i.*, 
             u.nombre AS conductor, u.rut AS rut_conductor, u.direccion AS direccion_conductor,
             u.telefono AS telefono_conductor, u.licencia AS licencia_conductor,
             v.patente AS vehiculo
      FROM inspecciones i
      JOIN usuarios u ON u.id = i.usuario_id
      JOIN vehiculos v ON v.id = i.vehiculo_id
      WHERE i.id = ?
      `,
      [id]
    );

    if (!rows.length) return res.status(404).send("Inspección no encontrada");
    const data = rows[0];

    // === ENCABEZADOS HTTP ===
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=inspeccion_${id}.pdf`);

    // === CREACIÓN DOCUMENTO ===
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 35, right: 35 },
      bufferPages: true, // Habilita numeración total
    });
    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo-curacavi.png");

    // === ENCABEZADO ===
    const drawHeader = () => {
      const L = doc.page.margins.left;
      const usableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      try {
        const fsSync = require("fs");
        if (fsSync.existsSync(logoPath)) doc.image(logoPath, L, 25, { width: 60 });
      } catch {}

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .text("MUNICIPALIDAD DE CURACAVÍ", L + 80, 30)
        .fontSize(10)
        .fillColor("#000")
        .text("Dirección de Operaciones, Departamento de Movilización.", L + 80, 45);

      doc
        .moveTo(L, 65)
        .lineTo(L + usableWidth, 65)
        .strokeColor("#003366")
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .text("INFORME DE INSPECCIÓN VEHICULAR", L, doc.y, {
          align: "left",
          width: usableWidth - 15,
        });

      // marcador temporal (será reemplazado luego)
      
      //const currentPage = doc.pageNumber;
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(`Ilustre Municipalidad de Curacaví`, L, doc.y + 2, {
          align: "left",
          width: usableWidth - 15,
        });
        
        

      doc.moveDown(0.5);
      doc.font("Helvetica").fillColor("#000").fontSize(10);
    };

    drawHeader();
    doc.on("pageAdded", drawHeader);
    const L = () => doc.page.margins.left;

    // === DATOS DE INSPECCIÓN ===
    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fillColor("#003366").text("Datos de la Inspección", L());
    doc.fillColor("#000").font("Helvetica").fontSize(10);
    doc.text(`ID Inspección: ${id}`);
    doc.text(`Vehículo: ${data.vehiculo}`);
    doc.text(`Fecha: ${new Date(data.created_at).toLocaleString("es-CL")}`);
    doc.moveDown(1);

    // === DATOS DEL CONDUCTOR ===
    doc.font("Helvetica-Bold").fillColor("#003366").text("Datos del Conductor", L());
    doc.fillColor("#000").font("Helvetica").fontSize(10);
    doc.text(`Conductor: ${data.conductor}`);
    if (data.rut_conductor) doc.text(`RUT: ${data.rut_conductor}`);
    if (data.direccion_conductor) doc.text(`Dirección: ${data.direccion_conductor}`);
    if (data.telefono_conductor) doc.text(`Teléfono: ${data.telefono_conductor}`);
    if (data.licencia_conductor) doc.text(`Clase Licencia: ${data.licencia_conductor}`);
    doc.moveDown(1);

    // === OBSERVACIONES ===
    doc.font("Helvetica-Bold").fillColor("#003366").text("Observaciones Generales", L());
    doc.moveDown(0.5).fillColor("#000");
    doc.text(data.observacion || "Sin observaciones registradas.");
    doc.moveDown(2);

    // === FOTO CENTRADA ===
    if (data.foto) {
      try {
        const base64Data = data.foto.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const tempPath = path.join("/tmp", `foto_${id}.jpg`);
        await fs.writeFile(tempPath, buffer);

        doc.font("Helvetica-Bold").fillColor("#003366").text("Evidencia Fotográfica", L());
        const imgWidth = 250;
        const usableWidth =
          doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const x = doc.page.margins.left + (usableWidth - imgWidth) / 2;
        doc.image(tempPath, x, doc.y, { width: imgWidth });
        await fs.unlink(tempPath);
        doc.moveDown(3);
      } catch (e) {
        console.error("Error procesando imagen:", e);
      }
    }

    // === ÍTEMS ===
    const [items] = await db.query(
      "SELECT item_key, existe, estado, obs FROM inspeccion_items WHERE inspeccion_id=?",
      [id]
    );

    const baseItems = [
      "Luces de estacionamiento","Luces bajas","Luces altas","Luz de freno (incluye tercera luz)",
      "Luz de marcha atrás","Luz de viraje derecho","Luz de viraje izquierdo","Luz de emergencia",
      "Luz de patente","Baliza","Freno de mano","Freno de pedal","Freno otros","Neumático delantero derecho",
      "Neumático delantero izquierdo","Neumático trasero derecho","Neumático trasero izquierdo",
      "Neumático de repuesto","Neumáticos otros","Aceite de motor","Agua del radiador","Líquido de freno",
      "Correas","Agua de batería","Extintor","Botiquín","Gata","Llave de ruedas","Triángulos",
      "Chaleco reflectante","Limpia parabrisas","Herramientas","Cinturón de seguridad","Espejos laterales",
      "Espejo interior","Radiotransmisor","Bocina de retroceso","Antena","Permiso de circulación",
      "Revisión técnica","Seguro obligatorio","Techo","Capot","Puertas","Vidrios","Tapabarros","Pick-up",
      "Parachoques","Tubo de escape","Aseo de cabina","Sanitización COVID-19",
    ];

    const merged = baseItems.map((b) => {
      const f = items.find((i) => i.item_key === b);
      return {
        item_key: b,
        existe: f?.existe || "SI",
        estado: f?.estado || "Bueno",
        obs: f?.obs || "",
      };
    });

    // === TABLA ===
    doc.moveDown(10);
    doc.font("Helvetica-Bold").fillColor("#003366").text("Ítems Inspeccionados", L());
    doc.moveDown(0.5).fillColor("#000");

    const startX = L();
    let y = doc.y;
    const colWidths = [180, 60, 80, 150];
    const headers = ["Ítem", "Existe", "Estado", "Observaciones"];
    const rowHeight = 18;

    doc.rect(startX, y, colWidths.reduce((a, b) => a + b), rowHeight).fillAndStroke("#003366", "#003366");
    doc.fillColor("#FFF").font("Helvetica-Bold").fontSize(10);
    let x = startX;
    headers.forEach((h, i) => {
      doc.text(h, x + 5, y + 4, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });

    y += rowHeight;
    doc.font("Helvetica").fontSize(9).fillColor("#000");

    for (const [index, it] of merged.entries()) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        drawHeader();
        y = doc.y + 20;
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b), rowHeight).fillAndStroke("#003366", "#003366");
        doc.fillColor("#FFF").font("Helvetica-Bold").fontSize(10);
        let xh = startX;
        headers.forEach((h, i) => {
          doc.text(h, xh + 5, y + 4, { width: colWidths[i] - 10 });
          xh += colWidths[i];
        });
        y += rowHeight;
        doc.font("Helvetica").fontSize(9).fillColor("#000");
      }

      const fillColor = index % 2 === 0 ? "#F9F9F9" : "#FFFFFF";
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b), rowHeight).fillAndStroke(fillColor, "#CCCCCC");
      x = startX;
      doc.fillColor("#000").text(it.item_key, x + 5, y + 4, { width: colWidths[0] - 10 });
      x += colWidths[0];
      doc.text(it.existe, x + 5, y + 4, { width: colWidths[1] - 10 });
      x += colWidths[1];
      const color = it.estado === "Bueno" ? "#008000" : "#CC0000";
      doc.fillColor(color).text(it.estado, x + 5, y + 4, { width: colWidths[2] - 10 });
      x += colWidths[2];
      doc.fillColor("#000").text(it.obs || "-", x + 5, y + 4, { width: colWidths[3] - 10 });
      y += rowHeight;
    }

    // === FIRMAS ===
    const firmaOffset = 56;
    const firmaY = y + firmaOffset;
    doc.font("Helvetica-Bold").fillColor("#000");

    if (firmaY > doc.page.height - 120) {
      doc.addPage();
      drawHeader();
      doc.moveDown(3);
    }

    const baseY = doc.y < firmaY ? firmaY : doc.y;
    doc.text("_____________________________", L(), baseY);
    doc.text(`Conductor: ${data.conductor}`, L() + 15, baseY + 12);
    if (data.rut_conductor)
      doc.text(`RUT: ${data.rut_conductor}`, L() + 15, baseY + 24);
    doc.text("_____________________________", L() + 260, baseY);
    doc.text("Supervisor:", L() + 270, baseY + 12);

    // === SEGUNDA PASADA: ACTUALIZA ENCABEZADO CON NÚMEROS REALES ===
    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = range.start; i < range.start + totalPages; i++) {
      doc.switchToPage(i);
      const Lh = doc.page.margins.left;
      const usableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageNum = i + 1;
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(`Página ${pageNum} de ${totalPages}`, Lh, 100, {
          align: "left",
          width: usableWidth - 15,
        });
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).send("Error al generar PDF");
  }
});

module.exports = router;
