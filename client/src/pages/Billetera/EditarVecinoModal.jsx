//client/src/pages/Billetera/EditarVecinoModal.jsx
import { useState } from "react";

export default function EditarVecinoModal({ vecino, onClose, onSave }) {
  const [monto, setMonto] = useState(vecino.saldo_actual);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(vecino.id, Number(monto)); // ← corrección segura
    onClose();
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom">

        <h5 className="fw-bold mb-3">
          Editar saldo de: {vecino.nombre}
        </h5>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nuevo Monto</label>
            <input
              type="number"
              className="form-control"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-between mt-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
