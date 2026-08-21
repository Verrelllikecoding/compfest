import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPage.css";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { dashboardApi } from "./lib/api.js";
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

function formatDuration(minutes) {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function formatTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeTime(value) {
  const date = new Date(value);
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function titleCase(value = "") {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function routePoints(stops) {
  if (!stops?.length) return [];
  const count = stops.length;
  return stops.map((stop, index) => ({
    ...stop,
    short: String(stop.sequenceNo ?? index + 1),
    left: `${14 + (index * 68) / Math.max(count - 1, 1)}%`,
    top: `${70 - (index * 38) / Math.max(count - 1, 1) + (index % 2 ? 5 : 0)}%`,
    active: stop.status === "arrived" || (index === 0 && !stops.some((item) => item.status === "arrived")),
  }));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    dashboardApi
      .summary(accessToken)
      .then((res) => {
        if (cancelled) return;
        setDashboard(res.data);
        setActiveRouteId((current) => current || res.data.routes?.[0]?.id || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const routes = dashboard?.routes || [];
  const activeRoute = useMemo(
    () => routes.find((route) => route.id === activeRouteId) || routes[0] || null,
    [routes, activeRouteId]
  );

  const stats = useMemo(() => {
    const data = dashboard?.stats;
    if (!data) return [];
    return [
      {
        label: "Total Deliveries",
        value: data.totalOrders.toLocaleString(),
        delta: `${data.deliveredOrders} done`,
        meta: "Orders recorded in the system",
        icon: PackageCheck,
        accent: "primary",
        onClick: () => navigate("/routes"),
      },
      {
        label: "Delivery Completion",
        value: `${data.completionRate}%`,
        delta: `${data.deliveredOrders}/${data.totalOrders || 0}`,
        meta: "Delivered orders vs total orders",
        icon: Clock3,
        accent: "teal",
        onClick: () => navigate("/routes"),
      },
      {
        label: "Active Routes",
        value: data.activeRoutes.toLocaleString(),
        delta: `${routes.length} loaded`,
        meta: "Vehicles currently on active routes",
        icon: RouteIcon,
        accent: "amber",
        onClick: () => navigate("/routes"),
      },
    ];
  }, [dashboard, navigate, routes.length]);

  const filteredWarehouses = useMemo(() => {
    const items = dashboard?.warehouses || [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${item.name} ${item.address} ${item.status}`.toLowerCase().includes(q)
    );
  }, [dashboard, search]);

  const schedules = dashboard?.schedules || [];
  const firstSchedule = schedules[0] || null;
  const routeMarkers = routePoints(activeRoute?.stops || []);
  const firstPendingStop = activeRoute?.stops?.find((stop) => stop.status === "pending");

  const aiInsight = dashboard?.stats
    ? dashboard.stats.lowStockProducts > 0
      ? `${dashboard.stats.lowStockProducts} product${dashboard.stats.lowStockProducts === 1 ? "" : "s"} are at or below their reorder point.`
      : activeRoute?.optimizedByAi
        ? `Latest route ${activeRoute.vehicle} is AI-optimized and currently ${activeRoute.completion}% complete.`
        : "Operations data is up to date. No critical inventory alert is currently detected."
    : "Loading operational insight...";

  return (
    <div className="dash-page">
      <Sidebar active="dashboard" />

      <main className="dash-main">
        <div className="dash-topbar">
          <div className="dash-topbar__copy">
            <h1>Good Morning, {user?.name?.split(" ")?.[0] || "Admin"}!</h1>
            <p>
              Monitor routes, warehouses, and delivery performance from one
              unified operations dashboard.
            </p>
          </div>

          <div className="dash-topbar__actions">
            <div className="dash-live-pill">
              <span className="dash-live-pill__dot" />
              {loading ? "Syncing data..." : "Backend connected"}
            </div>

            <button
              type="button"
              className="dash-icon-btn"
              aria-label="Notifications"
              title={`${dashboard?.unreadNotifications || 0} unread notifications`}
            >
              <Bell size={16} />
              {(dashboard?.unreadNotifications || 0) > 0 && (
                <span className="dash-icon-btn__badge">{dashboard.unreadNotifications}</span>
              )}
            </button>

            <div className="dash-search">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search warehouses..."
              />
              <Search size={16} />
            </div>
          </div>
        </div>

        {error && (
          <div className="dash-card" style={{ marginBottom: 16 }}>
            <b>Dashboard data could not be loaded.</b>
            <p style={{ margin: "6px 0 0" }}>{error}</p>
          </div>
        )}

        <section className="dash-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                type="button"
                className={`dash-card dash-card--stat dash-card--${stat.accent}`}
                key={stat.label}
                onClick={stat.onClick}
                style={{ textAlign: "left", cursor: "pointer" }}
              >
                <div className="dash-stat__top">
                  <div className="dash-stat__icon"><Icon size={18} /></div>
                  <span className="dash-stat__delta">{stat.delta}</span>
                </div>
                <span className="dash-stat__label">{stat.label}</span>
                <b className="dash-stat__value">{stat.value}</b>
                <small className="dash-stat__meta">{stat.meta}</small>
              </button>
            );
          })}

          <div className="dash-card dash-card--schedule">
            <div className="dash-card__head">
              <div>
                <h3>Today Schedule</h3>
                <p>{schedules.length} task{schedules.length === 1 ? "" : "s"} scheduled today</p>
              </div>
              <span className="dash-card__badge">
                {firstSchedule ? formatTime(firstSchedule.startTime) : "No task"}
              </span>
            </div>

            <div className="dash-timeline">
              {schedules.slice(0, 3).map((schedule) => (
                <div className="dash-timeline__step" key={schedule.id}>
                  <span className="dash-timeline__dot" />
                  <div>
                    <div className="dash-timeline__label">
                      {formatTime(schedule.startTime)} · {titleCase(schedule.type)}
                    </div>
                    <div className="dash-timeline__value">{schedule.title}</div>
                  </div>
                </div>
              ))}

              {!loading && schedules.length === 0 && (
                <div className="dash-timeline__step">
                  <span className="dash-timeline__dot" />
                  <div>
                    <div className="dash-timeline__label">No schedule yet</div>
                    <div className="dash-timeline__value">Today is clear</div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="dash-schedule__footer"
              onClick={() => navigate("/scheduling")}
              style={{ width: "100%", border: 0, cursor: "pointer" }}
            >
              <Truck size={15} />
              <span>{firstSchedule ? `Assigned to ${firstSchedule.assignee.name}` : "Open Smart Scheduling"}</span>
            </button>
          </div>

          <div className="dash-card dash-card--route">
            <div className="dash-card__head dash-card__head--route">
              <div>
                <h3>Route Overview</h3>
                <p>Live route data from operations</p>
              </div>

              <div className="dash-route-tabs">
                {routes.slice(0, 3).map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    className={route.id === activeRoute?.id ? "is-active" : ""}
                    onClick={() => setActiveRouteId(route.id)}
                  >
                    {route.vehicle}
                  </button>
                ))}
              </div>
            </div>

            {activeRoute ? (
              <div className="dash-route-layout">
                <div className="dash-map">
                  <div className="dash-map__grid" />
                  <svg className="dash-map__line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M14 74 C 30 61, 38 54, 48 45 S 68 28, 82 32" />
                  </svg>

                  {routeMarkers.map((point) => (
                    <div
                      key={point.id}
                      className={`dash-map__marker ${point.active ? "is-active" : ""}`}
                      style={{ left: point.left, top: point.top }}
                      title={point.destinationAddress}
                    >
                      <span>{point.short}</span>
                      <small>{point.customerName}</small>
                    </div>
                  ))}

                  <div className="dash-map__bubble">
                    <Radar size={16} />
                    <div>
                      <b>{activeRoute.vehicle}</b>
                      <span>{titleCase(activeRoute.status)}</span>
                    </div>
                  </div>
                </div>

                <div className="dash-route-info">
                  <div className="dash-route-info__card">
                    <span>Status</span>
                    <b>{titleCase(activeRoute.status)}</b>
                  </div>
                  <div className="dash-route-info__card">
                    <span>Distance</span>
                    <b>{activeRoute.distanceKm == null ? "—" : `${activeRoute.distanceKm.toLocaleString()} km`}</b>
                  </div>
                  <div className="dash-route-info__card">
                    <span>Stops</span>
                    <b>{activeRoute.completedStops}/{activeRoute.stopCount}</b>
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

                  <p className="dash-route-info__summary">
                    {firstPendingStop
                      ? `Next stop: ${firstPendingStop.customerName} · ${firstPendingStop.destinationAddress}`
                      : `Duration ${formatDuration(activeRoute.durationMin)} · ${activeRoute.optimizedByAi ? "AI optimized" : "Manual route"}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="dash-route-layout">
                <div className="dash-map"><div className="dash-map__grid" /></div>
                <div className="dash-route-info">
                  <p className="dash-route-info__summary">No route data is available yet.</p>
                  <button type="button" className="dash-link-btn" onClick={() => navigate("/routes")}>Create route <ArrowUpRight size={14} /></button>
                </div>
              </div>
            )}
          </div>

          <div className="dash-card dash-card--warehouse">
            <div className="dash-card__head">
              <div>
                <h3>Warehouse Overview</h3>
                <p>Inventory status by location</p>
              </div>
              <span className="dash-card__badge dash-card__badge--soft">
                {dashboard?.warehouses?.length || 0} sites
              </span>
            </div>

            <div className="dash-warehouse-list">
              {filteredWarehouses.slice(0, 3).map((warehouse) => (
                <div className="dash-warehouse-item" key={warehouse.id}>
                  <div className="dash-warehouse-item__top">
                    <div>
                      <b>{warehouse.name}</b>
                      <span>{warehouse.totalItems.toLocaleString()} items · {warehouse.productCount} SKUs</span>
                    </div>
                    <strong>{warehouse.healthPercent}%</strong>
                  </div>
                  <div className="dash-warehouse-item__bar">
                    <div style={{ width: `${warehouse.healthPercent}%` }} />
                  </div>
                  <small>{warehouse.status}{warehouse.lowStockCount > 0 ? ` · ${warehouse.lowStockCount} low stock` : ""}</small>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="dash-warehouse-summary"
              onClick={() => navigate("/warehouse")}
              style={{ width: "100%", border: 0, cursor: "pointer" }}
            >
              <div>
                <Boxes size={15} />
                <span>{(dashboard?.stats?.totalItemsMonitored || 0).toLocaleString()} items monitored</span>
              </div>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="dash-card dash-card--activity">
            <div className="dash-card__head">
              <div>
                <h3>Recent Activity</h3>
                <p>Latest operational events</p>
              </div>
              <button type="button" className="dash-link-btn" onClick={() => navigate("/warehouse")}>View operations <ArrowUpRight size={14} /></button>
            </div>

            <div className="dash-activity-list">
              {(dashboard?.activity || []).slice(0, 4).map((item) => (
                <div className="dash-activity-item" key={item.id}>
                  <div className="dash-activity-item__icon"><Activity size={15} /></div>
                  <div className="dash-activity-item__content">
                    <div className="dash-activity-item__top">
                      <b>{titleCase(item.title)}</b>
                      <span>{formatRelativeTime(item.createdAt)}</span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}

              {!loading && (dashboard?.activity || []).length === 0 && (
                <div className="dash-activity-item">
                  <div className="dash-activity-item__icon"><Activity size={15} /></div>
                  <div className="dash-activity-item__content"><p>No recent operational activity.</p></div>
                </div>
              )}
            </div>

            <div className="dash-insight-strip">
              <Sparkles size={16} />
              <span>AI Insight: {aiInsight}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
