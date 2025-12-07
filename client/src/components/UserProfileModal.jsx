import { useState } from "react";
import api from "../api/http";

export default function UserProfileModal({ show, onHide, onUserUpdate }) {
  if (!show) return null;

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [fotoPreview, setFotoPreview] = useState(
    user?.foto ? `${user.foto}?v=${Date.now()}` : "/default-user.png"
  );

  const [file, setFile] = useState(null);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");

  /* ===============================
     SUBIR FOTO
  =============================== */
  const subirFoto = async () => {
    try {
      if (!file) return;

      const form = new FormData();
      form.append("foto", file);

      // RUTA CORRECTA DEL BACKEND
      const res = await api.post("/usuarios/upload-photo", form);

      // Actualizar usuario en sessionStorage
      user.foto = res.data.url;
      sessionStorage.setItem("user", JSON.stringify(user));

      // Preview con cache-buster
      setFotoPreview(`${res.data.url}?v=${Date.now()}`);

      // Avisar al navbar
      if (onUserUpdate) onUserUpdate({ ...user });

      setMsg("Foto actualizada.");
    } catch (err) {
      console.error(err);
      setMsg("Error subiendo foto.");
    }
  };

  /* ===============================
     CAMBIO DE CONTRASEÑA
  =============================== */
  const cambiarPass = async () => {
    try {
      await api.post("/usuarios/change-password", {
        oldPassword: oldPass,
        newPassword: newPass,
      });

      setMsg("Contraseña actualizada correctamente.");
    } catch (err) {
      console.error(err);
      setMsg("Error al cambiar contraseña.");
    }
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 2000, backdropFilter: "blur(3px)" }}
        onClick={onHide}
      />

      {/* MODAL */}
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 3000 }}
        onClick={onHide}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          style={{ maxWidth: "400px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content p-3 shadow-lg">
            <div className="modal-header">
              <h5 className="modal-title">Mi Perfil</h5>
              <button className="btn-close" onClick={onHide}></button>
            </div>

            <div className="modal-body">
              {/* FOTO */}
              <div className="text-center mb-3">
                <img
                  src={fotoPreview}
                  alt="Foto Usuario"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #ddd",
                    boxShadow: "0px 0px 8px rgba(0,0,0,0.2)"
                  }}
                />

                <input
                  type="file"
                  className="form-control mt-2"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    setFile(f);
                    setFotoPreview(URL.createObjectURL(f));
                  }}
                />

                <button
                  className="btn btn-primary btn-sm mt-2"
                  onClick={subirFoto}
                >
                  Actualizar Foto
                </button>
              </div>

              {/* DATOS */}
              <div className="mb-3">
                <strong>Nombre:</strong> {user?.nombre} <br />
                <strong>Usuario:</strong> {user?.username} <br />
                <strong>Rol:</strong> {user?.rol}
              </div>

              <hr />

              {/* PASSWORD */}
              <h6 className="fw-bold">Cambiar contraseña</h6>

              <input
                type="password"
                className="form-control mt-2"
                placeholder="Contraseña actual"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
              />

              <input
                type="password"
                className="form-control mt-2"
                placeholder="Nueva contraseña"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />

              <button
                className="btn btn-warning mt-3 w-100"
                onClick={cambiarPass}
              >
                Actualizar Contraseña
              </button>

              {msg && <div className="alert alert-info mt-3">{msg}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
