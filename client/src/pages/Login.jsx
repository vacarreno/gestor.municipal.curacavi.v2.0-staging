import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/http";

export default function Login() {
  const nav = useNavigate();
  const { search } = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ============================================================
     MENSAJES GET (?expired & ?unauth)
  ============================================================ */
  useEffect(() => {
    const q = new URLSearchParams(search);

    if (q.get("expired")) {
      setError("Tu sesión expiró. Inicia sesión nuevamente.");
      sessionStorage.clear();
    }

    if (q.get("unauth")) {
      setError("Debes iniciar sesión para continuar.");
      sessionStorage.clear();
    }
  }, [search]);

  /* ============================================================
     SUBMIT LOGIN
  ============================================================ */
  const submit = async (e) => {
    e.preventDefault();

    if (loading) return;
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Usuario y contraseña son obligatorios.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });
      const data = res.data;

      if (!data?.token || !data?.user) {
        setError("Respuesta del servidor inválida.");
        return;
      }

      /* --------------------------------------------------------
         🔧 Normalizamos el usuario para garantizar .foto
         (el backend debe enviar foto, pero si no lo hace,
         evitamos que Navbar falle)
      -------------------------------------------------------- */
      const normalizedUser = {
        id: data.user.id,
        username: data.user.username,
        nombre: data.user.nombre,
        rol: data.user.rol,
        foto: data.user.foto || "/default-user.png",
        correo: data.user.correo || "",
        departamento: data.user.departamento || "",
      };

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(normalizedUser));

      nav("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        (typeof err === "string" ? err : "Error al iniciar sesión");

      if (msg.includes("CORS") || msg.includes("Failed to fetch")) {
        setError("El servidor no permite la conexión (CORS block).");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-bg d-flex align-items-center justify-content-center vh-100"
      style={{ background: "linear-gradient(135deg, #1E3A5F, #0A192F)" }}
    >
      <div
        className="login-card bg-white p-4 rounded shadow-lg"
        style={{
          width: "100%",
          maxWidth: "380px",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="text-center mb-3">
          <img
            src="/logo.png"
            alt="Logo Municipal"
            style={{
              width: "30vw", // escala según ancho de la pantalla
              maxWidth: "260px", // límite máximo para no deformar el layout
              height: "auto", // mantiene proporción
              objectFit: "contain",
              marginBottom: "15px",
            }}
          />
          <h4 className="fw-bold text-primary mb-1">Gestor Municipal</h4>
          <small className="text-muted mb-3 d-block">Inicio de sesión</small>
        </div>

        <form onSubmit={submit}>
          {error && <div className="alert alert-danger py-2">{error}</div>}

          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Usuario</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="text-center mt-3">
          <small className="text-muted">
            Desarrollado por el Departamento de Informática <br />
            <code>Curacaví - Chile</code>
          </small>
        </div>
      </div>
    </div>
  );
}
