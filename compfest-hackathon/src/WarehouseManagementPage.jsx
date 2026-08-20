import React, { useEffect, useMemo, useState } from "react";
import "./WarehouseManagementPage.css";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { warehouseApi, request } from "./lib/api.js";
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Building2,
  Filter,
  MoreVertical,
  User,
  Box,
  Package,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  CheckCircle2,
  Warehouse as WarehouseIcon,
  Sparkles,
  X,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data yang MASIH contoh — butuh field/endpoint tambahan di backend  */
/*  sebelum bisa disambungkan ke data asli (lihat catatan di masing-  */
/*  masing bagian).                                                   */
/* ------------------------------------------------------------------ */

// Warehouse Status butuh kolom kapasitas (m²) yang belum ada di schema,
// plus agregat inbound/outbound per gudang per hari.
const WAREHOUSES_MOCK = [
  { name: "Warehouse A", status: "Healthy", usage: 86, space: "1.248 / 1.450 m²", inbound: 64, outbound: 48, low: 15 },
  { name: "Warehouse B", status: "Healthy", usage: 72, space: "980 / 1.350 m²", inbound: 32, outbound: 26, low: 6 },
  { name: "Warehouse C", status: "Warning", usage: 94, space: "1.328 / 1.400 m²", inbound: 28, outbound: 12, low: 7 },
];

// Recent Activities idealnya dari tabel activity_logs — belum ada endpoint
// GET /activity yang di-expose ke frontend.
const ACTIVITIES_MOCK = [
  { time: "10:35", icon: ArrowDownCircle, tone: "green", text: "Inbound received: 20 x Laptop Stand", sub: "Warehouse A" },
  { time: "09:20", icon: ArrowUpCircle, tone: "blue", text: "Outbound shipped: 15 x Office Chair", sub: "Warehouse B" },
  { time: "08:15", icon: AlertTriangle, tone: "amber", text: "Low stock alert: Mechanical Keyboard", sub: "Warehouse C" },
  { time: "07:45", icon: RefreshCw, tone: "purple", text: "Stock adjustment: +10 x Wireless Mouse", sub: "Warehouse A" },
  { time: "Yesterday", icon: CheckCircle2, tone: "green", text: "Inventory check completed", sub: "Warehouse B" },
];

// Stock Movement (7 hari) butuh query agregat harian dari stock_movements —
// belum ada endpoint-nya.
const CHART_MOCK = [
  { day: "Aug 2", inbound: 60, outbound: 48, adj: 3 },
  { day: "Aug 3", inbound: 55, outbound: 44, adj: 4 },
  { day: "Aug 4", inbound: 70, outbound: 52, adj: 2 },
  { day: "Aug 5", inbound: 65, outbound: 50, adj: 5 },
  { day: "Aug 6", inbound: 80, outbound: 58, adj: 3 },
  { day: "Aug 7", inbound: 50, outbound: 46, adj: 4 },
  { day: "Aug 8", inbound: 52, outbound: 58, adj: 3 },
];
const CHART_MAX = 150;
const SUMMARY_MOCK = { inbound: "+432", outbound: "-356", adjustments: "+24", net: "+100" };

const TABS = [
  { key: "all", label: "All Items" },
  { key: "low", label: "Low Stock" },
  { key: "expiring", label: "Expiring Soon" },
];

const STATUS_STYLES = {
  in: { label: "In Stock", tone: "green" },
  low: { label: "Low Stock", tone: "amber" },
  out: { label: "Out of Stock", tone: "red" },
};

function formatRupiah(n) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function statusOf(item) {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.reorderPoint) return "low";
  return "in";
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function WarehouseManagementPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forecastItem, setForecastItem] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const { data: warehouses } = await warehouseApi.list(accessToken);
        const productLists = await Promise.all(
          warehouses.map((w) => warehouseApi.products(w.id, accessToken))
        );
        const flattened = productLists.flatMap((res, i) =>
          res.data.map((p) => ({ ...p, warehouseName: warehouses[i].name }))
        );
        if (!cancelled) setItems(flattened);
      } catch (err) {
        if (!cancelled) setError(err.message || "Gagal memuat data gudang");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, it) => sum + Number(it.unitPrice) * it.quantity, 0);
    const lowStockCount = items.filter((it) => it.quantity <= it.reorderPoint).length;
    return {
      totalValue: formatRupiah(totalValue),
      totalProducts: items.length,
      lowStock: lowStockCount,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (tab === "low") return items.filter((it) => it.quantity <= it.reorderPoint);
    return items; // "expiring" belum didukung data model, jadi tampilkan semua + catatan
  }, [items, tab]);


  async function handleForecast(item) {
    if (!accessToken) return;

    setForecastItem(item);
    setForecastData(null);
    setForecastError("");
    setForecastLoading(true);

    try {
      const result = await request(`/products/${item.id}/forecast`, { accessToken });
      setForecastData(result.data);
    } catch (err) {
      setForecastError(err.message || "Gagal mengambil AI forecast");
    } finally {
      setForecastLoading(false);
    }
  }

  function closeForecast() {
    setForecastItem(null);
    setForecastData(null);
    setForecastError("");
    setForecastLoading(false);
  }

  const STATS = [
    { icon: Box, label: "Total Inventory Value", value: stats.totalValue, note: "dari data live", tone: "blue", noteTone: "neutral" },
    { icon: Package, label: "Total Products", value: String(stats.totalProducts), note: "dari data live", tone: "green", noteTone: "neutral" },
    { icon: AlertTriangle, label: "Low Stock Items", value: String(stats.lowStock), note: "perlu perhatian", tone: "amber", noteTone: "red" },
    { icon: ArrowDownCircle, label: "Inbound Today", value: "—", note: "belum tersedia", tone: "indigo", noteTone: "neutral" },
    { icon: ArrowUpCircle, label: "Outbound Today", value: "—", note: "belum tersedia", tone: "teal", noteTone: "neutral" },
  ];

  return (
    <div className="wm-page">
      <Sidebar active="warehouse" />

      <main className="wm-main">
        {/* ---------------- top bar ---------------- */}
        <div className="wm-topbar">
          <div>
            <h1>Warehouse Management</h1>
            <p>Monitor inventory, track stock levels, and manage warehouse operations in real-time.</p>
          </div>

          <div className="wm-topbar__right">
            <div className="wm-search">
              <Search size={14} />
              <input type="text" placeholder="Search anything..." />
              <span className="wm-kbd">⌘K</span>
            </div>
            <button className="wm-icon-btn" aria-label="Notifikasi">
              <Bell size={17} />
              <span className="wm-icon-btn__badge">1</span>
            </button>
            <button className="wm-icon-btn" aria-label="Pesan">
              <MessageSquare size={17} />
            </button>
            <button className="wm-user">
              <span className="wm-user__avatar">
                <User size={14} />
              </span>
              <span className="wm-user__meta">
                <b>Admin User</b>
                <small>Super Admin</small>
              </span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* ---------------- filter bar ---------------- */}
        <div className="wm-filterbar">
          <div className="wm-filterbar__spacer" />
          <button className="wm-filter">
            <Building2 size={14} /> All Warehouses <ChevronDown size={12} />
          </button>
          <button className="wm-filter">
            <Calendar size={14} /> Aug 8, 2026
          </button>
          <button className="wm-btn-primary">
            <Plus size={15} /> Add New Item
          </button>
        </div>

        {error && (
          <div style={{ background: "#FBE7EA", color: "#A22C43", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* ---------------- stats ---------------- */}
        <div className="wm-stats">
          {STATS.map((s) => (
            <div className="wm-stat" key={s.label}>
              <span className={`wm-stat__icon wm-stat__icon--${s.tone}`}>
                <s.icon size={17} />
              </span>
              <div>
                <div className="wm-stat__label">{s.label}</div>
                <div className="wm-stat__value">{loading ? "…" : s.value}</div>
                <div className={`wm-stat__note wm-stat__note--${s.noteTone}`}>{s.note}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ---------------- body ---------------- */}
        <div className="wm-body">
          <div className="wm-col-main">
            {/* Inventory Overview */}
            <div className="wm-card">
              <div className="wm-card__head">
                <h3>Inventory Overview</h3>
              </div>

              <div className="wm-tabs">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    className={tab === t.key ? "wm-tab wm-tab--active" : "wm-tab"}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="wm-toolbar">
                <div className="wm-toolbar__search">
                  <Search size={13} />
                  <input type="text" placeholder="Search items..." />
                </div>
                <button className="wm-filter wm-filter--sm">
                  All Categories <ChevronDown size={12} />
                </button>
                <button className="wm-filter wm-filter--sm">
                  All Locations <ChevronDown size={12} />
                </button>
                <button className="wm-filter wm-filter--sm">
                  <Filter size={13} /> Filter
                </button>
              </div>

              {loading ? (
                <p style={{ padding: "20px 0", color: "#6B6892", fontSize: 13 }}>Memuat data inventory...</p>
              ) : tab === "expiring" ? (
                <p style={{ padding: "20px 0", color: "#6B6892", fontSize: 13 }}>
                  Fitur tanggal kedaluwarsa belum didukung — kolom ini belum ada di database produk.
                </p>
              ) : filteredItems.length === 0 ? (
                <p style={{ padding: "20px 0", color: "#6B6892", fontSize: 13 }}>Belum ada produk di database.</p>
              ) : (
                <table className="wm-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Warehouse</th>
                      <th>Stock</th>
                      <th>Reorder Point</th>
                      <th>Status</th>
                      <th>Value</th>
                      <th>AI Forecast</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((it) => {
                      const status = statusOf(it);
                      const pct = Math.min((it.quantity / (it.reorderPoint * 2 || 1)) * 100, 100);
                      return (
                        <tr key={it.id}>
                          <td>
                            <div className="wm-item">
                              <span className="wm-item__icon">
                                <Package size={13} />
                              </span>
                              {it.name}
                            </div>
                          </td>
                          <td className="wm-mono">{it.sku}</td>
                          <td>{it.category || "-"}</td>
                          <td>{it.warehouseName}</td>
                          <td>
                            <div className="wm-stockcell">
                              <span>{it.quantity}</span>
                              <div className="wm-stockbar">
                                <div
                                  className={`wm-stockbar__fill wm-stockbar__fill--${STATUS_STYLES[status].tone}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>{it.reorderPoint}</td>
                          <td>
                            <span className={`wm-badge wm-badge--${STATUS_STYLES[status].tone}`}>
                              {STATUS_STYLES[status].label}
                            </span>
                          </td>
                          <td className="wm-mono">{formatRupiah(Number(it.unitPrice) * it.quantity)}</td>
                          <td>
                            <button
                              className="wm-ai-btn"
                              onClick={() => handleForecast(it)}
                              disabled={forecastLoading && forecastItem?.id === it.id}
                            >
                              <Sparkles size={13} />
                              {forecastLoading && forecastItem?.id === it.id ? "Analyzing..." : "Forecast"}
                            </button>
                          </td>
                          <td>
                            <button className="wm-more" aria-label="Opsi lain">
                              <MoreVertical size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <div className="wm-pagination">
                <span>Menampilkan {filteredItems.length} dari {items.length} item</span>
              </div>
            </div>

            {/* Stock Movement — masih data contoh, lihat catatan di atas komponen */}
            <div className="wm-card">
              <div className="wm-card__head">
                <h3>Stock Movement (Last 7 Days)</h3>
                <button className="wm-filter wm-filter--sm">
                  7 Days <ChevronDown size={12} />
                </button>
              </div>

              <div className="wm-chart-legend">
                <span><i className="wm-dot wm-dot--green" /> Inbound</span>
                <span><i className="wm-dot wm-dot--blue" /> Outbound</span>
                <span><i className="wm-dot wm-dot--purple" /> Adjustments</span>
              </div>

              <div className="wm-chart-wrap">
                <div className="wm-chart">
                  <div className="wm-chart__axis">
                    <span>150</span><span>100</span><span>50</span><span>0</span>
                  </div>
                  <div className="wm-chart__bars">
                    {CHART_MOCK.map((c) => (
                      <div className="wm-chart__col" key={c.day}>
                        <div className="wm-chart__stack">
                          <div className="wm-chart__seg wm-chart__seg--green" style={{ height: `${(c.inbound / CHART_MAX) * 100}%` }} />
                          <div className="wm-chart__seg wm-chart__seg--blue" style={{ height: `${(c.outbound / CHART_MAX) * 100}%` }} />
                          <div className="wm-chart__seg wm-chart__seg--purple" style={{ height: `${(c.adj / CHART_MAX) * 100}%` }} />
                        </div>
                        <span className="wm-chart__label">{c.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="wm-chart-summary">
                  <div className="wm-chart-summary__title">Summary</div>
                  <div className="wm-chart-summary__row"><span>Total Inbound</span><b className="wm-text-green">{SUMMARY_MOCK.inbound}</b></div>
                  <div className="wm-chart-summary__row"><span>Total Outbound</span><b className="wm-text-red">{SUMMARY_MOCK.outbound}</b></div>
                  <div className="wm-chart-summary__row"><span>Total Adjustments</span><b className="wm-text-purple">{SUMMARY_MOCK.adjustments}</b></div>
                  <div className="wm-chart-summary__row wm-chart-summary__row--total"><span>Net Movement</span><b className="wm-text-green">{SUMMARY_MOCK.net}</b></div>
                </div>
              </div>
            </div>
          </div>

          <div className="wm-col-side">
            {/* Warehouse Status — masih data contoh */}
            <div className="wm-card">
              <div className="wm-card__head">
                <h3>Warehouse Status</h3>
                <a href="#">View All →</a>
              </div>

              <div className="wm-wh-list">
                {WAREHOUSES_MOCK.map((w) => (
                  <div className="wm-wh" key={w.name}>
                    <div className="wm-wh__head">
                      <span className="wm-wh__icon"><WarehouseIcon size={15} /></span>
                      <div className="wm-wh__title">
                        <b>{w.name}</b>
                        <span className={`wm-badge wm-badge--sm ${w.status === "Healthy" ? "wm-badge--green" : "wm-badge--amber"}`}>
                          {w.status}
                        </span>
                      </div>
                    </div>
                    <div className="wm-wh__usage">
                      <div className="wm-wh__usageRow"><span>Capacity Usage</span><b>{w.usage}%</b></div>
                      <div className="wm-stockbar wm-stockbar--wh">
                        <div className={`wm-stockbar__fill wm-stockbar__fill--${w.usage >= 90 ? "red" : "green"}`} style={{ width: `${w.usage}%` }} />
                      </div>
                      <span className="wm-wh__space">{w.space}</span>
                    </div>
                    <div className="wm-wh__stats">
                      <div><span>Inbound</span><b>{w.inbound}</b></div>
                      <div><span>Outbound</span><b>{w.outbound}</b></div>
                      <div><span>Low Stock</span><b>{w.low}</b></div>
                    </div>
                  </div>
                ))}
              </div>
              <a href="#" className="wm-card__footer-link">View All Warehouses →</a>
            </div>

            {/* Recent Activities — masih data contoh */}
            <div className="wm-card">
              <div className="wm-card__head">
                <h3>Recent Activities</h3>
                <a href="#">View All</a>
              </div>
              <div className="wm-activity-list">
                {ACTIVITIES_MOCK.map((a, i) => (
                  <div className="wm-activity" key={i}>
                    <span className={`wm-activity__icon wm-activity__icon--${a.tone}`}>
                      <a.icon size={14} />
                    </span>
                    <div>
                      <div className="wm-activity__text">{a.text}</div>
                      <div className="wm-activity__sub">{a.sub}</div>
                    </div>
                    <span className="wm-activity__time">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {forecastItem && (
        <div className="wm-forecast-overlay" onMouseDown={closeForecast}>
          <div className="wm-forecast-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="wm-forecast-modal__head">
              <div>
                <div className="wm-forecast-eyebrow">
                  <Sparkles size={13} /> AI Demand Forecast
                </div>
                <h3>{forecastItem.name}</h3>
                <p>{forecastItem.sku} · {forecastItem.warehouseName}</p>
              </div>
              <button className="wm-forecast-close" onClick={closeForecast} aria-label="Tutup forecast">
                <X size={18} />
              </button>
            </div>

            {forecastLoading ? (
              <div className="wm-forecast-state">
                <RefreshCw className="wm-spin" size={22} />
                <b>AI sedang menganalisis demand...</b>
                <span>Mengolah histori stock movement dan pola permintaan.</span>
              </div>
            ) : forecastError ? (
              <div className="wm-forecast-error">
                <AlertTriangle size={18} />
                <div>
                  <b>Forecast gagal dimuat</b>
                  <span>{forecastError}</span>
                </div>
              </div>
            ) : forecastData ? (
              <>
                <div className="wm-forecast-grid">
                  <div className="wm-forecast-metric">
                    <span>Current Stock</span>
                    <strong>{forecastData.currentStock}</strong>
                    <small>{forecastData.product?.unit || "unit"}</small>
                  </div>
                  <div className="wm-forecast-metric wm-forecast-metric--accent">
                    <span>Predicted Demand</span>
                    <strong>{forecastData.forecast.predictedDemand}</strong>
                    <small>next day</small>
                  </div>
                  <div className="wm-forecast-metric">
                    <span>Recommended Stock</span>
                    <strong>{forecastData.forecast.recommendedStock}</strong>
                    <small>incl. safety stock</small>
                  </div>
                  <div className="wm-forecast-metric">
                    <span>Suggested Restock</span>
                    <strong>{forecastData.forecast.suggestedRestock}</strong>
                    <small>{forecastData.product?.unit || "unit"}</small>
                  </div>
                </div>

                <div className="wm-forecast-recommendation">
                  <span className="wm-forecast-recommendation__icon"><TrendingUp size={17} /></span>
                  <div>
                    <span>AI Recommendation</span>
                    <b>
                      {forecastData.forecast.status === "critical"
                        ? `Critical stock level. Restock ${forecastData.forecast.suggestedRestock} ${forecastData.product?.unit || "units"} as soon as possible.`
                        : forecastData.forecast.status === "restock"
                        ? `Demand is projected above current stock. Consider restocking ${forecastData.forecast.suggestedRestock} ${forecastData.product?.unit || "units"}.`
                        : "Current inventory is sufficient for the predicted demand."}
                    </b>
                  </div>
                  <span className={`wm-forecast-status wm-forecast-status--${forecastData.forecast.status}`}>
                    {forecastData.forecast.status}
                  </span>
                </div>

                <div className="wm-forecast-foot">
                  Forecast date: <b>{forecastData.forecast.date}</b>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}