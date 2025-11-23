import { useEffect, useState } from "react";
import { getVecinos, updateSaldo, regenerarQR } from "../services/billeteraService";
import EditarVecinoModal from "./EditarVecinoModal";
import "./styles.css";

export default function BilleteraPage() {
  const [vecinos, setVecinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const cargarVecinos = async () => {
    try {
      setLoading(true);
      const res = await getVecinos();
      setVecinos(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVecinos();
  }, []);

  const abrirEditor = (vecino) => setSelected(vecino);
  const cerrarEditor = () => setSelected(null);

  const handleActualizarSaldo = async (id, nuevoMonto) => {
    await updateSaldo(id, nuevoMonto);
    await cargarVecinos();
  };

  const handleRegenerarQR = async (id) => {
    await regenerarQR(id);
    await cargarVecinos();
  };

  return (
    <div className="container py-3">

      <h3 className="fw-bold mb-3">Gestión de Billetera Vecinal</h3>

      {loading && <div className="spinner-border text-primary" />}

      {!loading && (
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Foto</th>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Teléfono</th>
                <th>Saldo Actual</th>
                <th>QR</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vecinos.map((v) => (
                <tr key={v.id}>
                  <td>
                    <img
                      src={v.foto}
                      alt=""
                      className="vecino-foto"
                    />
                  </td>
                  <td>{v.nombre}</td>
                  <td>{v.rut}</td>
                  <td>{v.telefono}</td>
                  <td className="fw-bold text-success">${v.saldo_actual}</td>

                  {/* === CORRECCIÓN: v.qr_url no existe === */}
                  <td>
                    {v.qr_token ? (
                      <span className="text-success fw-bold">{v.qr_token}</span>
                    ) : (
                      <span className="text-muted">No generado</span>
                    )}
                  </td>

                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => abrirEditor(v)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => handleRegenerarQR(v.id)}
                    >
                      Regenerar QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <EditarVecinoModal
          vecino={selected}
          onClose={cerrarEditor}
          onSave={handleActualizarSaldo}
        />
      )}
    </div>
  );
}
