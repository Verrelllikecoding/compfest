import React from "react";
import "./RouteOptimizationPage.css";
import Sidebar from "./Sidebar.jsx";
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  User,
  RotateCw,
  Plus,
  Calendar,
  Maximize2,
  Minus,
  LocateFixed,
  Home,
  Sparkles,
  ArrowRight,
  GripVertical,
  MoreVertical,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA (contoh — nanti diganti hasil POST /routes/generate)          */
/* ------------------------------------------------------------------ */

const STOPS = [
  { id: 0, type: "warehouse", marker: "", name: "Warehouse A", address: "Jl. Industri Raya No.10, Jakarta", eta: "08:00", etaRange: "Departure", orders: "-", status: "Start", x: 13, y: 50 },
  { id: 1, type: "delivery", marker: 1, name: "PT. Sejahtera Abadi", address: "Jl. Sudirman No.45, Jakarta", eta: "08:35", etaRange: "08:35 - 08:45", orders: 2, status: "On Time", x: 37, y: 22 },
  { id: 2, type: "delivery", marker: 2, name: "Toko Makmur", address: "Jl. Gatot Subroto No.88, Jakarta", eta: "09:20", etaRange: "09:20 - 09:30", orders: 1, status: "On Time", x: 44, y: 66 },
  { id: 3, type: "pickup", marker: 3, name: "Gudang Mitra", address: "Jl. Ahmad Yani No.120, Jakarta", eta: "10:05", etaRange: "10:05 - 10:20", orders: 1, status: "On Time", x: 62, y: 40 },
  { id: 4, type: "delivery", marker: 4, name: "CV. Berkah Jaya", address: "Jl. Diponegoro No.33, Jakarta", eta: "10:50", etaRange: "10:50 - 11:00", orders: 2, status: "On Time", x: 78, y: 75 },
  { id: 5, type: "customer", marker: 5, name: "PT. Maju Bersama", address: "Jl. MH Thamrin No.1, Jakarta", eta: "11:40", etaRange: "11:40", orders: 2, status: "End", x: 89, y: 58 },
];

const TYPE_META = {
  warehouse: { color: "blue", label: "Warehouse (Start)" },
  delivery: { color: "green", label: "Delivery Stop" },
  pickup: { color: "amber", label: "Pickup Stop" },
  customer: { color: "red", label: "Customer" },
};

const SUMMARY = {
  distance: "48.6 km",
  time: "2h 14m",
  stops: "5",
  orders: "8",
  fuelSaving: "18%",
  costSaving: "Rp 124.000",
};

const COMPARISON = [
  { label: "Distance", current: "59.3 km", optimized: "48.6 km", pct: 82 },
  { label: "Estimated Time", current: "2h 38m", optimized: "2h 14m", pct: 85 },
  { label: "Fuel Cost", current: "Rp 229.000", optimized: "Rp 188.000", pct: 82 },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function RouteOptimizationPage() {
  const pathPoints = STOPS.map((s) => `${s.x},${s.y}`).join(" ");

  return (
    <div className="ro-page">
      <Sidebar active="routes" />

      <main className="ro-main">
        {/* ---------------- top bar ---------------- */}
        <div className="ro-topbar">
          <div>
            <h1>Route Optimization</h1>
            <p>AI-powered route planning for faster, smarter, and more efficient deliveries.</p>
          </div>

          <div className="ro-topbar__right">
            <div className="ro-search">
              <Search size={14} />
              <input type="text" placeholder="Search anything..." />
              <span className="ro-kbd">⌘K</span>
            </div>
            <button className="ro-icon-btn" aria-label="Notifikasi">
              <Bell size={17} />
              <span className="ro-icon-btn__badge">3</span>
            </button>
            <button className="ro-icon-btn" aria-label="Pesan">
              <MessageSquare size={17} />
            </button>
            <button className="ro-user">
              <span className="ro-user__avatar">
                <User size={14} />
              </span>
              <span className="ro-user__meta">
                <b>Admin User</b>
                <small>Super Admin</small>
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* ---------------- filter bar ---------------- */}
        <div className="ro-filterbar">
          <div className="ro-field">
            <label>Route</label>
            <button>
              Route #RT-102 <ChevronDown size={13} />
            </button>
          </div>
          <div className="ro-field">
            <label>Date</label>
            <button>
              Aug 8, 2026 <Calendar size={13} />
            </button>
          </div>
          <div className="ro-field">
            <label>Vehicle</label>
            <button>
              Truck A-01 <ChevronDown size={13} />
            </button>
          </div>
          <div className="ro-field">
            <label>Driver</label>
            <button>
              <span className="ro-field__avatar">
                <User size={11} />
              </span>
              Budi Santoso <ChevronDown size={13} />
            </button>
          </div>

          <div className="ro-filterbar__actions">
            <button className="ro-btn-outline">
              <RotateCw size={14} /> Re-optimize Route
            </button>
            <button className="ro-btn-primary">
              <Plus size={15} /> Create New Route
            </button>
          </div>
        </div>

        {/* ---------------- map + summary ---------------- */}
        <div className="ro-body">
          <div className="ro-card ro-map-card">
            <div className="ro-map">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ro-map__bg">
                <rect width="100" height="100" fill="#E9EFF4" />
                <line x1="0" y1="20" x2="100" y2="15" className="ro-map__road" />
                <line x1="10" y1="0" x2="30" y2="100" className="ro-map__road" />
                <line x1="0" y1="60" x2="100" y2="55" className="ro-map__road" />
                <line x1="60" y1="0" x2="55" y2="100" className="ro-map__road" />
                <line x1="0" y1="85" x2="100" y2="90" className="ro-map__road" />
              </svg>

              <span className="ro-map__area" style={{ left: "46%", top: "10%" }}>
                North Jakarta
              </span>
              <span className="ro-map__area" style={{ left: "68%", top: "30%" }}>
                East Jakarta
              </span>
              <span className="ro-map__area" style={{ left: "14%", top: "88%" }}>
                South Jakarta
              </span>

              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ro-map__route">
                <polyline points={pathPoints} className="ro-map__routeline" />
              </svg>

              {STOPS.map((s) => (
                <div
                  key={s.id}
                  className={`ro-marker ro-marker--${TYPE_META[s.type].color}`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                >
                  {s.type === "warehouse" ? <Home size={13} /> : s.marker}
                </div>
              ))}

              <div className="ro-legend">
                <div className="ro-legend__title">Legend</div>
                <div className="ro-legend__row">
                  <span className="ro-legend__icon ro-legend__icon--blue">
                    <Home size={11} />
                  </span>
                  Warehouse (Start)
                </div>
                <div className="ro-legend__row">
                  <span className="ro-legend__dot ro-legend__dot--green" /> Delivery Stop
                </div>
                <div className="ro-legend__row">
                  <span className="ro-legend__dot ro-legend__dot--amber" /> Pickup Stop
                </div>
                <div className="ro-legend__row">
                  <span className="ro-legend__dot ro-legend__dot--red" /> Customer
                </div>
                <div className="ro-legend__row">
                  <span className="ro-legend__line" /> Optimized Route
                </div>
              </div>

              <div className="ro-map__controls">
                <button aria-label="Fullscreen">
                  <Maximize2 size={14} />
                </button>
                <button aria-label="Zoom in">
                  <Plus size={14} />
                </button>
                <button aria-label="Zoom out">
                  <Minus size={14} />
                </button>
                <button aria-label="Lokasi saya">
                  <LocateFixed size={14} />
                </button>
              </div>
            </div>
          </div>

          <aside className="ro-card ro-summary">
            <div className="ro-summary__head">
              <h3>Route Summary</h3>
              <span className="ro-badge-ai">AI Optimized</span>
            </div>

            <div className="ro-summary__grid">
              <div>
                <span>Total Distance</span>
                <b>{SUMMARY.distance}</b>
              </div>
              <div>
                <span>Estimated Time</span>
                <b>{SUMMARY.time}</b>
              </div>
              <div>
                <span>Total Stops</span>
                <b>{SUMMARY.stops}</b>
              </div>
              <div>
                <span>Total Orders</span>
                <b>{SUMMARY.orders}</b>
              </div>
              <div>
                <span>Fuel Saving</span>
                <b className="ro-text-green">{SUMMARY.fuelSaving}</b>
                <small>vs current route</small>
              </div>
              <div>
                <span>Cost Saving</span>
                <b className="ro-text-green">{SUMMARY.costSaving}</b>
                <small>vs current route</small>
              </div>
            </div>

            <div className="ro-ai-box">
              <div className="ro-ai-box__title">
                <Sparkles size={13} /> AI Recommendation
              </div>
              <p>
                This optimized route reduces distance by 18% and saves
                approximately 24 minutes compared to your current route.
              </p>
              <button>
                View Details <ArrowRight size={13} />
              </button>
            </div>
          </aside>
        </div>

        {/* ---------------- bottom: stops / comparison / timeline ---------------- */}
        <div className="ro-bottom">
          {/* Route Stops */}
          <div className="ro-card">
            <div className="ro-card__head">
              <h3>Route Stops ({STOPS.length - 1})</h3>
              <button className="ro-filter-sm">
                Optimize Order <ChevronDown size={12} />
              </button>
            </div>
            <table className="ro-table">
              <thead>
                <tr>
                  <th></th>
                  <th>#</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>ETA</th>
                  <th>Order(s)</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {STOPS.map((s, i) => (
                  <tr key={s.id}>
                    <td className="ro-table__grip">
                      <GripVertical size={13} />
                    </td>
                    <td className="ro-mono">{i === 0 ? "" : i}</td>
                    <td>
                      <span className={`ro-marker ro-marker--sm ro-marker--${TYPE_META[s.type].color}`}>
                        {s.type === "warehouse" ? <Home size={11} /> : s.marker}
                      </span>
                    </td>
                    <td>
                      <div className="ro-table__loc">{s.name}</div>
                      <div className="ro-table__sub">{s.address}</div>
                    </td>
                    <td className="ro-mono">{s.eta}</td>
                    <td>{s.orders}</td>
                    <td>
                      <span
                        className={`ro-badge ${
                          s.status === "Start"
                            ? "ro-badge--blue"
                            : s.status === "End"
                            ? "ro-badge--neutral"
                            : "ro-badge--green"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <button className="ro-more" aria-label="Opsi lain">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Route Comparison */}
          <div className="ro-card">
            <div className="ro-card__head">
              <h3>Route Comparison</h3>
            </div>
            <div className="ro-compare-legend">
              <span>
                <i className="ro-dot ro-dot--gray" /> Current Route
              </span>
              <span>
                <i className="ro-dot ro-dot--blue" /> Optimized Route (AI)
              </span>
            </div>

            {COMPARISON.map((c) => (
              <div className="ro-compare-row" key={c.label}>
                <div className="ro-compare-row__head">
                  <span>{c.label}</span>
                  <b>{c.optimized}</b>
                </div>
                <div className="ro-compare-track">
                  <div className="ro-compare-fill" style={{ width: `${c.pct}%` }} />
                </div>
                <div className="ro-compare-row__current">{c.current}</div>
              </div>
            ))}

            <div className="ro-improvement">
              <div className="ro-improvement__ring">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" className="ro-ring-track" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="ro-ring-fill"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - 0.18)}`}
                  />
                </svg>
                <span>18%</span>
              </div>
              <div>
                <b>Total Improvement</b>
                <p>Great job! AI optimization helped you save time, distance, and fuel cost.</p>
              </div>
            </div>
          </div>

          {/* Driver & Route Timeline */}
          <div className="ro-card">
            <div className="ro-card__head">
              <h3>Driver & Route Timeline</h3>
            </div>
            <div className="ro-timeline">
              {STOPS.map((s, i) => (
                <div className="ro-timeline__step" key={s.id}>
                  <span className={`ro-marker ro-marker--sm ro-marker--${TYPE_META[s.type].color}`}>
                    {s.type === "warehouse" ? <Home size={10} /> : s.marker}
                  </span>
                  <div>
                    <div className="ro-timeline__name">{s.name}</div>
                    <div className="ro-timeline__eta">
                      {i === 0 ? `${s.eta} · Departure` : `ETA ${s.etaRange}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}