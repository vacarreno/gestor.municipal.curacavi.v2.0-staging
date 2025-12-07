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
  Wallet,
  Wallet2,
  List
} from "react-bootstrap-icons";

export default function NavbarLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false); 
  const [showBilletera, setShowBilletera] = useState(false); 

  // === USUARIO LOGUEADO ===
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const rol = user?.rol || "user";

  // === LOGOUT CORPORATIVO ===
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className={`app-shell ${navOpen ? "nav-open" : ""}`}>

      {/* BOTÓN MENÚ MÓVIL (Ahora se oculta si el menú está abierto) */}
      {!navOpen && (
        <button
          className="hamburger btn btn-light"
          aria-label="Abrir menú"
          onClick={() => setNavOpen(true)}
          style={{
            position: "fixed",
            top: "4px",
            left: "3px",
            zIndex: 2000,
            fontSize: "24px",
            padding: "4px 10px",
          }}
        >
          <List size={28} />
        </button>
      )}

      {/* SIDEBAR */}
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

          {/* === Dashboard === */}
          {(rol === "admin" || rol === "Supervisor") && (
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
          )}

          {/* === Inspección === */}
          {(rol === "Conductor" || rol === "admin" || rol === "Supervisor") && (
            <>
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

          {/* === Conductores / Vehículos / Mantenciones / Reportes === */}
          {(rol === "admin" || rol === "Supervisor") && (
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

          {/* === Billetera === */}
          {(rol === "adminbilletera" || rol === "admin") && (
            <div className="config-menu mt-2">
              <button
                type="button"
                className="btn btn-link text-start p-0 w-100 d-flex align-items-center gap-2 text-white"
                onClick={() => setShowBilletera(!showBilletera)}
                style={{
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                <Wallet /> Billetera
              </button>

              {showBilletera && (
                <div className="ps-4 d-grid gap-1 mt-1">
                  <NavLink
                    to="/billetera"
                    className={({ isActive }) =>
                      `d-flex align-items-center gap-2 nav-link text-white ${
                        isActive ? "fw-bold text-primary" : ""
                      }`
                    }
                  >
                    <Wallet2 /> Gestión de Billetera
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* === Configuración === */}
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

      {/* BACKDROP */}
      <div
        className={`backdrop ${navOpen ? "show" : ""}`}
        onClick={() => setNavOpen(false)}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="d-flex flex-column">
        <header className="header p-2 px-3 d-flex align-items-center justify-content-between border-bottom bg-light">
          <div className="text-muted small"></div>

          <div className="d-flex align-items-center gap-3">

  {/* FOTO REAL DEL USUARIO */}
  <img
    src={user?.foto || "/default-user.png"}
    alt="Foto Usuario"
    onClick={() => setShowProfile(true)}
    style={{
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      objectFit: "cover",
      cursor: "pointer",
      border: "2px solid #ccc"
    }}
  />

  {/* NOMBRE + ROL */}
  <div
    className="d-flex align-items-center gap-2 text-secondary fw-semibold"
    style={{ cursor: "pointer" }}
    onClick={() => setShowProfile(true)}
  >
    {user?.nombre || user?.username || "Usuario"}
    <span className="text-muted small">({rol})</span>
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
          © {new Date().getFullYear()} GESTOR MUNICIPAL — I. Municipalidad de Curacaví
        </footer>
      </div>
    </div>
  );
}
