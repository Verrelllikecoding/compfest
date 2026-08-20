import React from "react";
import "./Sidebar.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import {
  Boxes,
  Home,
  Calendar,
  Route,
  Warehouse,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV_MAIN = [{ key: "dashboard", icon: Home, label: "Dashboard", to: "/dashboard" }];

const NAV_OPERATIONS = [
  { key: "scheduling", icon: Calendar, label: "Smart Scheduling", to: "/scheduling" },
  { key: "routes", icon: Route, label: "Route Optimization", to: "/routes" },
];

const NAV_MANAGEMENT = [
  { key: "warehouse", icon: Warehouse, label: "Warehouse Management", to: "/warehouse" },
];

export default function Sidebar({ active }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const renderItem = (n) => (
    <Link
      to={n.to}
      key={n.key}
      className={`sb-nav__item ${active === n.key ? "sb-nav__item--active" : ""}`}
    >
      <n.icon size={17} />
      {n.label}
    </Link>
  );

  return (
    <aside className="sb-sidebar">
      <div className="sb-brand">
        <span className="sb-brand__mark">
          <Boxes size={18} strokeWidth={2.4} />
        </span>
        <div>
          <div className="sb-brand__name">OPSERA</div>
          <div className="sb-brand__tag">
            {user ? `Halo, ${user.name}` : "AI-Powered Operations Platform"}
          </div>
        </div>
      </div>

      <nav className="sb-nav">
        {NAV_MAIN.map(renderItem)}

        <span className="sb-nav__group">Operations</span>
        {NAV_OPERATIONS.map(renderItem)}

        <span className="sb-nav__group">Management</span>
        {NAV_MANAGEMENT.map(renderItem)}

        <span className="sb-nav__group">AI Assistant</span>
        <Link to="/ai" className="sb-nav__item sb-nav__item--ai">
          <Sparkles size={17} />
          Ask Opsera AI
          <span className="sb-nav__badge">New</span>
        </Link>
      </nav>

      <div className="sb-sidebar__bottom">
        <Link to="/settings" className="sb-nav__item">
          <Settings size={17} />
          Settings
        </Link>
        <button className="sb-nav__item sb-nav__item--logout" onClick={handleLogout}>
          <LogOut size={17} />
          Logout
        </button>

        <div className="sb-upgrade">
          <div className="sb-upgrade__title">
            <Sparkles size={14} />
            Upgrade to Pro
          </div>
          <p>Unlock advanced AI insights and priority support.</p>
          <button type="button">Upgrade Now</button>
        </div>
      </div>
    </aside>
  );
}