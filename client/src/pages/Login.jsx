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

  // Mensajes GET (?expired & ?unauth)
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

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      nav("/dashboard", { replace: true });
    } catch (err) {
      // Normaliza mensaje de error
      const msg =
        err?.response?.data?.message || 
        err?.response?.data?.error ||
        err?.message ||
        (typeof err === "string" ? err : "Error al iniciar sesión");

      // Caso típico CORS bloqueado en Render
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
    position: "fixed",       // ← fija la tarjeta
    top: "50%",              // ← centro vertical real
    left: "50%",             // ← centro horizontal real
    transform: "translate(-50%, -50%)", // ← evita movimientos del DOM
  }}
>

        {/* LOGO */}
        <div className="text-center mb-3">
          <img
            src="/logo.png"
            alt="Logo Municipal"
            style={{
              width: "80px",
              height: "80px",
              objectFit: "contain",
              marginBottom: "10px",
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
