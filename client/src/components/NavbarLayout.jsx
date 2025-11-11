import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  HouseDoor,
  PeopleFill,
  Truck,
  FileEarmarkText,
  ClipboardCheck,
  Gear,
  PersonFillGear,
  PersonCircle,
  Wrench,
} from "react-bootstrap-icons";

export default function NavbarLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Obtener usuario y rol desde sessionStorage
  const user = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();
  const rol = user?.rol || "user";

  // Cierre de sesión seguro
  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className={`app-shell ${navOpen ? "nav-open" : ""}`}>
      {/* Botón menú lateral (solo visible en móvil) */}
      <button
        className="hamburger btn btn-light btn-sm"
        aria-label="Abrir menú"
        onClick={() => setNavOpen(true)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`sidebar ${navOpen ? "show" : ""}`}
        role="navigation"
        style={{
          backgroundColor: "#1E3A5F",
          color: "#fff",
          minHeight: "100vh",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <strong style={{ color: "#fff" }}>GESTOR MUNICIPAL</strong>
          <button
            className="btn btn-sm btn-outline-light d-lg-none"
            onClick={() => setNavOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="d-grid gap-2" onClick={() => setNavOpen(false)}>
          {/* --- Visible para TODOS --- */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `d-flex align-items-center gap-2 nav-link text-white ${
                isActive ? "fw-bold text-primary" : ""
              }`
            }
          >
            <HouseDoor /> Dashboard
          </NavLink>

          {/* --- Inspección solo para Conductor o Admin --- */}
          {(rol === "Conductor" || rol === "admin" || rol === "Supervisor") && (
            <NavLink
              to="/inspeccion"
              className={({ isActive }) =>
                `d-flex align-items-center gap-2 nav-link text-white ${
                  isActive ? "fw-bold text-primary" : ""
                }`
              }
            >
              <ClipboardCheck /> Inspección
            </NavLink>
          )}

          {/* --- Conductores, Vehículos, Mantenciones, Reportes --- */}
          {(rol === "Conductor" || rol === "admin" || rol === "Supervisor") && (
            <>
              <NavLink
                to="/conductores"
                className={({ isActive }) =>
                  `d-flex align-items-center gap-2 nav-link text-white ${
                    isActive ? "fw-bold text-primary" : ""
                  }`
                }
              >
                <PeopleFill /> Conductores
              </NavLink>

              <NavLink
                to="/vehiculos"
                className={({ isActive }) =>
                  `d-flex align-items-center gap-2 nav-link text-white ${
                    isActive ? "fw-bold text-primary" : ""
                  }`
                }
              >
                <Truck /> Vehículos
              </NavLink>

              {/* --- Nuevo Menú: Mantenciones --- */}
              <NavLink
                to="/mantenciones"
                className={({ isActive }) =>
                  `d-flex align-items-center gap-2 nav-link text-white ${
                    isActive ? "fw-bold text-primary" : ""
                  }`
                }
              >
                <Wrench /> Mantenciones
              </NavLink>

              <NavLink
                to="/reportes"
                className={({ isActive }) =>
                  `d-flex align-items-center gap-2 nav-link text-white ${
                    isActive ? "fw-bold text-primary" : ""
                  }`
                }
              >
                <FileEarmarkText /> Reportes
              </NavLink>
            </>
          )}

          {/* --- CONFIGURACIÓN (solo admin) --- */}
          {rol === "admin" && (
            <div className="config-menu mt-2">
              <button
                type="button"
                className="btn btn-link text-start p-0 w-100 d-flex align-items-center gap-2 text-white"
                onClick={() => setShowConfig(!showConfig)}
                style={{
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                <Gear /> Configuración
              </button>

              {showConfig && (
                <div className="ps-4 d-grid gap-1 mt-1">
                  <NavLink
                    to="/usuarios"
                    className={({ isActive }) =>
                      `d-flex align-items-center gap-2 nav-link text-white ${
                        isActive ? "fw-bold text-primary" : ""
                      }`
                    }
                  >
                    <PersonFillGear /> Usuarios
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>

      {/* Fondo oscuro cuando el menú móvil está abierto */}
      <div
        className={`backdrop ${navOpen ? "show" : ""}`}
        onClick={() => setNavOpen(false)}
      />

      {/* Contenedor principal */}
      <div className="d-flex flex-column">
        <header className="header p-2 px-3 d-flex align-items-center justify-content-between border-bottom bg-light">
          <div className="text-muted small">
            API: {import.meta.env.VITE_API_URL || "http://localhost:3001"}
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Usuario logueado */}
            <div className="d-flex align-items-center gap-2 text-secondary fw-semibold">
              <PersonCircle size={20} />
              {user?.nombre || user?.username || "Usuario"}
              <span className="text-muted small">
                ({rol.charAt(0).toUpperCase() + rol.slice(1)})
              </span>
            </div>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="content flex-grow-1">
          <Outlet />
        </main>

        <footer className="footer p-2 px-3 text-center text-muted small">
          © {new Date().getFullYear()} GESTOR MUNICIPAL — I. Municipalidad de
          Curacaví
        </footer>
      </div>
    </div>
  );
}
