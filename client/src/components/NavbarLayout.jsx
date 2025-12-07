import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  HouseDoor,
  PeopleFill,
  Truck,
  FileEarmarkText,
  ClipboardCheck,
  Gear,
  PersonFillGear,
  Wrench,
  Wallet,
  Wallet2,
  List
} from "react-bootstrap-icons";

import UserProfileModal from "../components/UserProfileModal";

export default function NavbarLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showBilletera, setShowBilletera] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [user, setUser] = useState(() =>
    JSON.parse(sessionStorage.getItem("user") || "{}")
  );

  /* ============================================================
     Sincroniza navbar <-> sessionStorage cuando se actualiza foto
  ============================================================ */
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
      if (stored.foto !== user.foto) {
        setUser(stored);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [user]);

  const rol = user?.rol || "user";

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className={`app-shell ${navOpen ? "nav-open" : ""}`}>
    
      {/* ... TODO TU CÓDIGO ORIGINAL ... */}

      <UserProfileModal
        show={showProfile}
        onHide={() => setShowProfile(false)}
        onUserUpdate={setUser}
      />
    </div>
  );
}
