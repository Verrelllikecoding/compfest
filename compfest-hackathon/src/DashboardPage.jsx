import React, { useMemo, useState } from "react";
import "./DashboardPage.css";
import Sidebar from "./Sidebar.jsx";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Boxes,
  ChevronRight,
  Clock3,
  PackageCheck,
  Radar,
  Route as RouteIcon,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";

const STATS = [
  {
    label: "Total Deliveries",
    value: "134",
    delta: "+12.6%",
    meta: "Compared to yesterday",
    icon: PackageCheck,
    accent: "primary",
  },
  {
    label: "On-Time Delivery",
    value: "120",
    delta: "89%",
    meta: "Service level today",
    icon: Clock3,
    accent: "teal",
  },
  {
    label: "Active Routes",
    value: "90",
    delta: "24 live",
    meta: "Vehicles on the road",
    icon: RouteIcon,
    accent: "amber",
  },
];

const ROUTES = [
  {
    id: "express",
    label: "Express Lane",
    eta: "08h 25m",
    completion: 72,
    status: "On Track",
    vehicle: "TRK-204",
    distance: "6,742 km",
    cargo: "Electronics · 28 pallets",
    summary: "High-priority cross-border shipment with live monitoring enabled.",
    steps: [
      { label: "Current Location", value: "Jeddah Port, Jeddah" },
      { label: "Departure", value: "Istanbul, Turkey" },
      { label: "Arrival", value: "New York, NY" },
    ],
    points: [
      { name: "Jeddah", short: "JED", left: "16%", top: "72%", active: true },
      { name: "Istanbul", short: "IST", left: "43%", top: "42%" },
      { name: "New York", short: "NYC", left: "81%", top: "33%" },
    ],
  },
  {
    id: "ocean",
    label: "Ocean Freight",
    eta: "16h 10m",
    completion: 54,
    status: "In Transit",
    vehicle: "SEA-118",
    distance: "10,120 km",
    cargo: "Industrial Parts · 44 containers",
    summary: "Ocean freight shipment moving through the Atlantic corridor.",
    steps: [
      { label: "Current Location", value: "Suez Transit Corridor" },
      { label: "Departure", value: "Jebel Ali, Dubai" },
      { label: "Arrival", value: "Rotterdam, NL" },
    ],
    points: [
      { name: "Dubai", short: "DXB", left: "20%", top: "76%", active: true },
      { name: "Suez", short: "SUZ", left: "38%", top: "57%" },
      { name: "Rotterdam", short: "RTM", left: "70%", top: "27%" },
    ],
  },
  {
    id: "air",
    label: "Air Cargo",
    eta: "03h 40m",
    completion: 88,
    status: "Landing Soon",
    vehicle: "AIR-09",
    distance: "4,015 km",
    cargo: "Medical Supply · 9 containers",
    summary: "Urgent air cargo route with accelerated customs clearance.",
    steps: [
      { label: "Current Location", value: "Doha Airspace" },
      { label: "Departure", value: "Singapore, SG" },
      { label: "Arrival", value: "Frankfurt, DE" },
    ],
    points: [
      { name: "Singapore", short: "SIN", left: "22%", top: "78%", active: true },
      { name: "Doha", short: "DOH", left: "48%", top: "49%" },
      { name: "Frankfurt", short: "FRA", left: "73%", top: "25%" },
    ],
  },
];

const WAREHOUSES = [
  { name: "Warehouse A", stock: "1,240 items", level: 78, status: "Healthy" },
  { name: "Warehouse B", stock: "890 items", level: 64, status: "Restock Soon" },
  { name: "Warehouse C", stock: "1,520 items", level: 91, status: "High Load" },
];

const ACTIVITY_LOG = [
  {
    title: "Route #18 optimized",
    desc: "AI updated the stop sequence and reduced ETA by 14 minutes.",
    time: "2 min ago",
  },
  {
    title: "Warehouse B low stock alert",
    desc: "Three SKUs are below the reorder threshold.",
    time: "8 min ago",
  },
  {
    title: "Truck TRK-204 checkpoint reached",
    desc: "Shipment entered the customs review zone without delays.",
    time: "18 min ago",
  },
  {
    title: "Daily report generated",
    desc: "Operations summary is ready for export in PDF and Excel.",
    time: "31 min ago",
  },
];

export default function DashboardPage() {
  const [activeRouteId, setActiveRouteId] = useState(ROUTES[0].id);
  const activeRoute = useMemo(
    () => ROUTES.find((route) => route.id === activeRouteId) || ROUTES[0],
    [activeRouteId]
  );

  return (
    <div className="dash-page">
      <Sidebar active="dashboard" />

      <main className="dash-main">
        <div className="dash-topbar">
          <div className="dash-topbar__copy">
            <h1>Good Morning, Admin!</h1>
            <p>
              Monitor routes, warehouses, and delivery performance from one
              unified operations dashboard.
            </p>
          </div>

          <div className="dash-topbar__actions">
            <div className="dash-live-pill">
              <span className="dash-live-pill__dot" />
              Live tracking active
            </div>

            <button type="button" className="dash-icon-btn" aria-label="Notifications">
              <Bell size={16} />
              <span className="dash-icon-btn__badge">3</span>
            </button>

            <div className="dash-search">
              <input type="text" placeholder="Search shipments, routes, warehouses..." />
              <Search size={16} />
            </div>
          </div>
        </div>

        <section className="dash-grid">
          {STATS.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className={`dash-card dash-card--stat dash-card--${stat.accent}`} key={stat.label}>
                <div className="dash-stat__top">
                  <div className="dash-stat__icon">
                    <Icon size={18} />
                  </div>
                  <span className="dash-stat__delta">{stat.delta}</span>
                </div>
                <span className="dash-stat__label">{stat.label}</span>
                <b className="dash-stat__value">{stat.value}</b>
                <small className="dash-stat__meta">{stat.meta}</small>
              </div>
            );
          })}

          <div className="dash-card dash-card--schedule">
            <div className="dash-card__head">
              <div>
                <h3>Today Schedule</h3>
                <p>{activeRoute.label}</p>
              </div>
              <span className="dash-card__badge">ETA {activeRoute.eta}</span>
            </div>

            <div className="dash-timeline">
              {activeRoute.steps.map((step) => (
                <div className="dash-timeline__step" key={step.label}>
                  <span className="dash-timeline__dot" />
                  <div>
                    <div className="dash-timeline__label">{step.label}</div>
                    <div className="dash-timeline__value">{step.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dash-schedule__footer">
              <Truck size={15} />
              <span>Next checkpoint update expected in 20 minutes</span>
            </div>
          </div>

          <div className="dash-card dash-card--route">
            <div className="dash-card__head dash-card__head--route">
              <div>
                <h3>Route Overview</h3>
                <p>Interactive route simulation</p>
              </div>

              <div className="dash-route-tabs">
                {ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    className={route.id === activeRoute.id ? "is-active" : ""}
                    onClick={() => setActiveRouteId(route.id)}
                  >
                    {route.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-route-layout">
              <div className="dash-map">
                <div className="dash-map__grid" />
                <svg className="dash-map__line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M14 74 C 30 61, 38 54, 48 45 S 68 28, 82 32" />
                </svg>

                {activeRoute.points.map((point) => (
                  <div
                    key={point.name}
                    className={`dash-map__marker ${point.active ? "is-active" : ""}`}
                    style={{ left: point.left, top: point.top }}
                  >
                    <span>{point.short}</span>
                    <small>{point.name}</small>
                  </div>
                ))}

                <div className="dash-map__bubble">
                  <Radar size={16} />
                  <div>
                    <b>{activeRoute.vehicle}</b>
                    <span>{activeRoute.status}</span>
                  </div>
                </div>
              </div>

              <div className="dash-route-info">
                <div className="dash-route-info__card">
                  <span>Status</span>
                  <b>{activeRoute.status}</b>
                </div>
                <div className="dash-route-info__card">
                  <span>Distance</span>
                  <b>{activeRoute.distance}</b>
                </div>
                <div className="dash-route-info__card">
                  <span>Cargo</span>
                  <b>{activeRoute.cargo}</b>
                </div>

                <div className="dash-progress">
                  <div className="dash-progress__head">
                    <span>Route completion</span>
                    <b>{activeRoute.completion}%</b>
                  </div>
                  <div className="dash-progress__bar">
                    <div style={{ width: `${activeRoute.completion}%` }} />
                  </div>
                </div>

                <p className="dash-route-info__summary">{activeRoute.summary}</p>
              </div>
            </div>
          </div>

          <div className="dash-card dash-card--warehouse">
            <div className="dash-card__head">
              <div>
                <h3>Warehouse Overview</h3>
                <p>Inventory status by location</p>
              </div>
              <span className="dash-card__badge dash-card__badge--soft">3 sites</span>
            </div>

            <div className="dash-warehouse-list">
              {WAREHOUSES.map((warehouse) => (
                <div className="dash-warehouse-item" key={warehouse.name}>
                  <div className="dash-warehouse-item__top">
                    <div>
                      <b>{warehouse.name}</b>
                      <span>{warehouse.stock}</span>
                    </div>
                    <strong>{warehouse.level}%</strong>
                  </div>
                  <div className="dash-warehouse-item__bar">
                    <div style={{ width: `${warehouse.level}%` }} />
                  </div>
                  <small>{warehouse.status}</small>
                </div>
              ))}
            </div>

            <div className="dash-warehouse-summary">
              <div>
                <Boxes size={15} />
                <span>3,650 items monitored</span>
              </div>
              <ChevronRight size={15} />
            </div>
          </div>

          <div className="dash-card dash-card--activity">
            <div className="dash-card__head">
              <div>
                <h3>Recent Activity</h3>
                <p>Latest operational events</p>
              </div>
              <button type="button" className="dash-link-btn">
                View all <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="dash-activity-list">
              {ACTIVITY_LOG.map((item) => (
                <div className="dash-activity-item" key={item.title}>
                  <div className="dash-activity-item__icon">
                    <Activity size={15} />
                  </div>
                  <div className="dash-activity-item__content">
                    <div className="dash-activity-item__top">
                      <b>{item.title}</b>
                      <span>{item.time}</span>
                    </div>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="dash-insight-strip">
              <Sparkles size={16} />
              <span>
                AI Insight: Delivery efficiency is trending upward thanks to
                improved route batching today.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}