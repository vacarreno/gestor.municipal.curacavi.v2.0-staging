import { useEffect, useState } from "react";
import api from "../api/http";
import { Button, Table, Modal, Form, Spinner } from "react-bootstrap";
import { PlusCircle, PencilSquare, Trash, Plus, Dash } from "react-bootstrap-icons";

export default function Mantenciones() {
  const [mantenciones, setMantenciones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    id: null, 
    vehiculo_id: "",
    usuario_id: "",
    tipo: "",
    observacion: "",
    costo: "",
    items: [],
  });

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isConductor = user?.rol?.toLowerCase() === "conductor";

  // ======================= CARGA DATOS ==========================
  const loadData = async () => {
    setLoading(true);
    try {
      const [mant, veh, usr] = await Promise.all([
        api.get("/mantenciones"),
        api.get("/vehiculos"),
        api.get("/usuarios"),
      ]);

      setMantenciones(mant.data || []);
      setVehiculos(veh.data || []);
      setUsuarios(usr.data || []);
    } catch (e) {
      alert("Error cargando datos: " + (e?.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ======================= FORMULARIO ===========================
  const abrirModal = (m = null) => {
    if (m) {
      setForm({ ...m, items: m.items || [] });
      setIsEditing(true);
    } else {
      setForm({
        id: null,
        vehiculo_id: "",
        usuario_id: user.id || "",
        tipo: "",
        observacion: "",
        costo: "",
        items: [],
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setIsEditing(false);
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { item: "", tipo: "Tarea", cantidad: 1, costo_unitario: 0 },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (idx, field, value) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx][field] = value;
      return { ...f, items };
    });
  };

  // ======================= GUARDAR ==============================
  const guardar = async () => {
    const { vehiculo_id, usuario_id, tipo, observacion, costo, items, id } = form;

    if (!vehiculo_id || !tipo) {
      alert("Debe seleccionar vehículo y tipo de mantención");
      return;
    }

    const payload = {
      vehiculo_id: Number(vehiculo_id),
      usuario_id: Number(usuario_id),
      tipo,
      observacion,
      costo: parseFloat(costo) || 0,
      items: items.map((i) => ({
        item: i.item,
        tipo: i.tipo,
        cantidad: parseFloat(i.cantidad) || 1,
        costo_unitario: parseFloat(i.costo_unitario) || 0,
      })),
    };

    try {
      if (isEditing) {
        await api.put(`/mantenciones/${id}`, payload);
        alert("Mantención actualizada correctamente");
      } else {
        await api.post("/mantenciones", payload);
        alert("Mantención registrada correctamente");
      }
      cerrarModal();
      loadData();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Error inesperado";
      alert("Error al guardar: " + msg);
    }
  };

  // ======================= ELIMINAR =============================
  const eliminar = async (id) => {
    if (!window.confirm("¿Desea eliminar esta mantención?")) return;

    try {
      await api.delete(`/mantenciones/${id}`);
      alert("Mantención eliminada correctamente");
      loadData();
    } catch (e) {
      alert("Error al eliminar: " + (e.response?.data?.message || e.message));
    }
  };

  // ======================= PDF ===============================
  const verPDF = (id) => {
    const url = `https://curacavi-backend.onrender.com/mantenciones/${id}/pdf`;
    window.open(url, "_blank");
  };

  // ======================= UI PRINCIPAL =========================
  return (
    <div className="container-fluid px-2 px-sm-3">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3">
        <h3 className="m-0 text-primary fw-semibold mb-2 mb-sm-0">
          Mantenciones
        </h3>

        {!isConductor && (
          <Button
            variant="primary"
            size="sm"
            className="shadow-sm"
            onClick={() => abrirModal()}
          >
            <PlusCircle className="me-1" /> Nueva mantención
          </Button>
        )}
      </div>

      <div className="card shadow-sm p-2 p-sm-3">
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>N°</th>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Responsable</th>
                  <th>Fecha</th>
                  <th>Costo</th>
                  <th>Observación</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenciones.length ? (
                  mantenciones.map((m, i) => (
                    <tr key={m.id}>
                      <td>{i + 1}</td>
                      <td>{m.vehiculo_patente || "-"}</td>
                      <td>{m.tipo}</td>
                      <td>{m.responsable || "-"}</td>
                      <td>
                        {m.fecha
                          ? new Date(m.fecha).toLocaleDateString("es-CL")
                          : "-"}
                      </td>
                      <td>${Number(m.costo || 0).toLocaleString("es-CL")}</td>
                      <td>{m.observacion || "-"}</td>
                      <td className="text-center">
                        <Button
                          variant="link"
                          className="text-primary p-0 me-2"
                          onClick={() => verPDF(m.id)}
                          title="Ver PDF"
                        >
                          📄
                        </Button>

                        {!isConductor && (
                          <>
                            <button
                              className="btn btn-link text-primary p-0 me-2"
                              title="Editar"
                              onClick={() => abrirModal(m)}
                            >
                              <PencilSquare size={18} />
                            </button>

                            <button
                              className="btn btn-link text-danger p-0"
                              title="Eliminar"
                              onClick={() => eliminar(m.id)}
                            >
                              <Trash size={18} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      Sin registros
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* === MODAL === */}
      <Modal show={showModal} onHide={cerrarModal} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold text-primary">
            {isEditing ? "Editar Mantención" : "Nueva Mantención"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label>Vehículo</Form.Label>
                <Form.Select
                  value={form.vehiculo_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehiculo_id: e.target.value }))
                  }
                >
                  <option value="">Seleccione vehículo</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.patente} ({v.numero_interno})
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Label>Responsable</Form.Label>
                <Form.Select
                  value={form.usuario_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, usuario_id: e.target.value }))
                  }
                >
                  <option value="">Seleccione responsable</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre || u.username}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-6 mb-3">
                <Form.Label>Tipo</Form.Label>
                <Form.Control
                  type="text"
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-6 mb-3">
                <Form.Label>Costo total (CLP)</Form.Label>
                <Form.Control
                  type="number"
                  value={form.costo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, costo: e.target.value }))
                  }
                />
              </div>

              <div className="col-12 mb-3">
                <Form.Label>Observación</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.observacion}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, observacion: e.target.value }))
                  }
                />
              </div>
            </div>

            <hr />
            <h5 className="fw-semibold text-secondary mb-3">
              Detalle de Tareas / Repuestos
            </h5>

            <div className="table-responsive">
              <Table bordered size="sm" className="align-middle text-center">
                <thead className="table-light">
                  <tr>
                    <th>Ítem / Descripción</th>
                    <th>Tipo</th>
                    <th>Cant.</th>
                    <th>Costo Unitario</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <Form.Control
                          value={item.item}
                          onChange={(e) =>
                            updateItem(idx, "item", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <Form.Select
                          value={item.tipo}
                          onChange={(e) =>
                            updateItem(idx, "tipo", e.target.value)
                          }
                        >
                          <option value="Tarea">Tarea</option>
                          <option value="Repuesto">Repuesto</option>
                          <option value="Otro">Otro</option>
                        </Form.Select>
                      </td>

                      <td>
                        <Form.Control
                          type="number"
                          value={item.cantidad}
                          onChange={(e) =>
                            updateItem(idx, "cantidad", e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <Form.Control
                          type="number"
                          value={item.costo_unitario}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "costo_unitario",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        $
                        {(
                          (parseFloat(item.cantidad) || 0) *
                          (parseFloat(item.costo_unitario) || 0)
                        ).toLocaleString("es-CL")}
                      </td>

                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeItem(idx)}
                        >
                          <Dash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <Button
              variant="outline-primary"
              size="sm"
              className="mt-2"
              onClick={addItem}
            >
              <Plus className="me-1" />
              Agregar ítem
            </Button>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardar}>
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
