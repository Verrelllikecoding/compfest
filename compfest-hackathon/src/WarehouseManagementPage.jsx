import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./WarehouseManagementPage.css";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { warehouseApi, request } from "./lib/api.js";
import {
  Search,
  Bell,
  ChevronDown,
  Plus,
  Building2,
  User,
  Box,
  Package,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Warehouse as WarehouseIcon,
  Sparkles,
  X,
  TrendingUp,
  SlidersHorizontal,
  History,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  Check,
} from "lucide-react";

const TABS = [
  { key: "all", label: "All Items" },
  { key: "low", label: "Low Stock" },
  { key: "out", label: "Out of Stock" },
];

const STATUS_STYLES = {
  in: { label: "In Stock", tone: "green" },
  low: { label: "Low Stock", tone: "amber" },
  out: { label: "Out of Stock", tone: "red" },
};

const MOVEMENT_META = {
  in: { label: "Inbound", icon: ArrowDownCircle, tone: "green", sign: "+" },
  out: { label: "Outbound", icon: ArrowUpCircle, tone: "blue", sign: "-" },
  adjustment: { label: "Adjustment", icon: RefreshCw, tone: "purple", sign: "+" },
};

function formatRupiah(value) {
  const n = Number(value || 0);
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function statusOf(item) {
  if (Number(item.quantity) <= 0) return "out";
  if (Number(item.quantity) <= Number(item.reorderPoint)) return "low";
  return "in";
}

function localDateKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTimeAgo(value) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(date.getTime())) return "-";
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 172_800_000) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function movementDelta(movement) {
  if (movement.type === "out") return -Number(movement.quantity || 0);
  return Number(movement.quantity || 0);
}

function getLastNDays(days) {
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    result.push({
      key: localDateKey(d),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      inbound: 0,
      outbound: 0,
      adj: 0,
    });
  }
  return result;
}

export default function WarehouseManagementPage() {
  const { accessToken, user } = useAuth();

  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [chartDays, setChartDays] = useState(7);

  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    warehouseId: "",
    sku: "",
    name: "",
    category: "",
    unit: "pcs",
    quantity: 0,
    reorderPoint: 0,
    unitPrice: 0,
  });

  const [movementItem, setMovementItem] = useState(null);
  const [movementSaving, setMovementSaving] = useState(false);
  const [movementForm, setMovementForm] = useState({ type: "in", quantity: 1, note: "" });

  const [forecastItem, setForecastItem] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");

    try {
      const warehouseResponse = await warehouseApi.list(accessToken);
      const warehouseList = warehouseResponse.data || [];

      const productResponses = await Promise.all(
        warehouseList.map((warehouse) => warehouseApi.products(warehouse.id, accessToken))
      );

      const productList = productResponses.flatMap((response, index) =>
        (response.data || []).map((product) => ({
          ...product,
          warehouseName: warehouseList[index].name,
          warehouseAddress: warehouseList[index].address,
        }))
      );

      const movementResponses = await Promise.all(
        productList.map(async (product) => {
          try {
            const response = await warehouseApi.movements(product.id, accessToken);
            return (response.data || []).map((movement) => ({
              ...movement,
              productName: product.name,
              sku: product.sku,
              unit: product.unit,
              warehouseId: product.warehouseId,
              warehouseName: product.warehouseName,
            }));
          } catch {
            return [];
          }
        })
      );

      const allMovements = movementResponses
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setWarehouses(warehouseList);
      setItems(productList);
      setMovements(allMovements);

      setAddForm((current) => ({
        ...current,
        warehouseId: current.warehouseId || warehouseList[0]?.id || "",
      }));
    } catch (err) {
      setError(err.message || "Gagal memuat data warehouse");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(),
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const status = statusOf(item);
      if (tab === "low" && status !== "low") return false;
      if (tab === "out" && status !== "out") return false;
      if (warehouseFilter !== "all" && item.warehouseId !== warehouseFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (!normalizedQuery) return true;
      return [item.name, item.sku, item.category, item.warehouseName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [items, tab, warehouseFilter, categoryFilter, query]);

  const todayKey = localDateKey(new Date());

  const todayMovements = useMemo(
    () => movements.filter((movement) => localDateKey(movement.createdAt) === todayKey),
    [movements, todayKey]
  );

  const stats = useMemo(() => {
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0
    );
    const lowStock = items.filter((item) => statusOf(item) === "low").length;
    const outOfStock = items.filter((item) => statusOf(item) === "out").length;
    const inboundToday = todayMovements
      .filter((movement) => movement.type === "in")
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
    const outboundToday = todayMovements
      .filter((movement) => movement.type === "out")
      .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);

    return { totalValue, lowStock, outOfStock, inboundToday, outboundToday };
  }, [items, todayMovements]);

  const chartData = useMemo(() => {
    const days = getLastNDays(chartDays);
    const index = new Map(days.map((day) => [day.key, day]));

    movements.forEach((movement) => {
      const target = index.get(localDateKey(movement.createdAt));
      if (!target) return;
      if (movement.type === "in") target.inbound += Number(movement.quantity || 0);
      if (movement.type === "out") target.outbound += Number(movement.quantity || 0);
      if (movement.type === "adjustment") target.adj += Number(movement.quantity || 0);
    });

    return days;
  }, [movements, chartDays]);

  const chartSummary = useMemo(() => {
    const inbound = chartData.reduce((sum, day) => sum + day.inbound, 0);
    const outbound = chartData.reduce((sum, day) => sum + day.outbound, 0);
    const adjustments = chartData.reduce((sum, day) => sum + day.adj, 0);
    return { inbound, outbound, adjustments, net: inbound - outbound + adjustments };
  }, [chartData]);

  const chartMax = Math.max(
    10,
    ...chartData.map((day) => day.inbound + day.outbound + day.adj)
  );

  const warehouseStatus = useMemo(() => {
    return warehouses.map((warehouse) => {
      const warehouseItems = items.filter((item) => item.warehouseId === warehouse.id);
      const warehouseMovementsToday = todayMovements.filter(
        (movement) => movement.warehouseId === warehouse.id
      );
      const healthyCount = warehouseItems.filter((item) => statusOf(item) === "in").length;
      const low = warehouseItems.filter((item) => statusOf(item) !== "in").length;
      const health = warehouseItems.length
        ? Math.round((healthyCount / warehouseItems.length) * 100)
        : 100;
      const totalUnits = warehouseItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      const inbound = warehouseMovementsToday
        .filter((movement) => movement.type === "in")
        .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
      const outbound = warehouseMovementsToday
        .filter((movement) => movement.type === "out")
        .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);

      let status = "Healthy";
      if (health < 60 || warehouseItems.some((item) => statusOf(item) === "out")) status = "Critical";
      else if (health < 80 || low > 0) status = "Attention";

      return {
        ...warehouse,
        totalProducts: warehouseItems.length,
        totalUnits,
        low,
        inbound,
        outbound,
        health,
        status,
      };
    });
  }, [warehouses, items, todayMovements]);

  const recentActivities = useMemo(() => movements.slice(0, 7), [movements]);

  async function handleAddItem(event) {
    event.preventDefault();
    if (!accessToken || !addForm.warehouseId) return;

    setAddSaving(true);
    setError("");
    try {
      await warehouseApi.createProduct(
        addForm.warehouseId,
        {
          sku: addForm.sku.trim(),
          name: addForm.name.trim(),
          category: addForm.category.trim() || undefined,
          unit: addForm.unit.trim(),
          quantity: Number(addForm.quantity),
          reorderPoint: Number(addForm.reorderPoint),
          unitPrice: Number(addForm.unitPrice),
        },
        accessToken
      );
      setAddOpen(false);
      setAddForm({
        warehouseId: warehouses[0]?.id || "",
        sku: "",
        name: "",
        category: "",
        unit: "pcs",
        quantity: 0,
        reorderPoint: 0,
        unitPrice: 0,
      });
      setSuccess("Item berhasil ditambahkan ke inventory.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Gagal menambahkan item");
    } finally {
      setAddSaving(false);
    }
  }

  function openMovement(item, type = "in") {
    setMovementItem(item);
    setMovementForm({ type, quantity: 1, note: "" });
  }

  async function handleMovement(event) {
    event.preventDefault();
    if (!movementItem || !accessToken) return;

    setMovementSaving(true);
    setError("");
    try {
      const result = await warehouseApi.createMovement(
        movementItem.id,
        {
          type: movementForm.type,
          quantity: Number(movementForm.quantity),
          note: movementForm.note.trim() || undefined,
        },
        accessToken
      );
      setMovementItem(null);
      setSuccess(
        `${MOVEMENT_META[movementForm.type].label} tercatat. Stok baru: ${result.data.newQuantity} ${movementItem.unit}.`
      );
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Gagal mencatat stock movement");
    } finally {
      setMovementSaving(false);
    }
  }

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

  const statCards = [
    {
      icon: Box,
      label: "Inventory Value",
      value: formatRupiah(stats.totalValue),
      note: `${items.length} products across ${warehouses.length} warehouses`,
      tone: "blue",
      noteTone: "neutral",
    },
    {
      icon: AlertTriangle,
      label: "Need Attention",
      value: String(stats.lowStock + stats.outOfStock),
      note: `${stats.lowStock} low · ${stats.outOfStock} out`,
      tone: "amber",
      noteTone: stats.lowStock + stats.outOfStock > 0 ? "red" : "green",
    },
    {
      icon: ArrowDownCircle,
      label: "Inbound Today",
      value: String(stats.inboundToday),
      note: "units received from real movements",
      tone: "indigo",
      noteTone: "neutral",
    },
    {
      icon: ArrowUpCircle,
      label: "Outbound Today",
      value: String(stats.outboundToday),
      note: "units dispatched from real movements",
      tone: "teal",
      noteTone: "neutral",
    },
    {
      icon: History,
      label: "Movement Records",
      value: String(movements.length),
      note: "audit trail loaded from database",
      tone: "green",
      noteTone: "neutral",
    },
  ];

  return (
    <div className="wm-page">
      <Sidebar active="warehouse" />

      <main className="wm-main">
        <div className="wm-topbar">
          <div>
            <h1>Warehouse Management</h1>
            <p>Live inventory control, stock movement audit, warehouse health, and AI restock insight.</p>
          </div>

          <div className="wm-topbar__right">
            <div className="wm-search">
              <Search size={14} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search SKU, item, warehouse..."
              />
            </div>
            <button className="wm-icon-btn" type="button" aria-label="Refresh data" onClick={loadDashboard}>
              <RefreshCw size={17} className={loading ? "wm-spin" : ""} />
            </button>
            <button className="wm-icon-btn" type="button" aria-label="Notifications">
              <Bell size={17} />
              {stats.lowStock + stats.outOfStock > 0 && (
                <span className="wm-icon-btn__badge">{Math.min(stats.lowStock + stats.outOfStock, 9)}</span>
              )}
            </button>
            <div className="wm-user">
              <span className="wm-user__avatar"><User size={14} /></span>
              <span className="wm-user__meta">
                <b>{user?.name || "User"}</b>
                <small>{user?.role?.replace("_", " ") || "warehouse"}</small>
              </span>
            </div>
          </div>
        </div>

        <div className="wm-filterbar">
          <label className="wm-select-control">
            <Building2 size={14} />
            <select value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)}>
              <option value="all">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <ChevronDown size={12} />
          </label>
          <div className="wm-filterbar__spacer" />
          <button className="wm-btn-secondary" type="button" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={14} className={loading ? "wm-spin" : ""} /> Refresh
          </button>
          <button className="wm-btn-primary" type="button" onClick={() => setAddOpen(true)}>
            <Plus size={15} /> Add New Item
          </button>
        </div>

        {error && <div className="wm-alert wm-alert--error"><AlertTriangle size={16} />{error}</div>}
        {success && <div className="wm-alert wm-alert--success"><Check size={16} />{success}</div>}

        <div className="wm-stats">
          {statCards.map((stat) => (
            <div className="wm-stat" key={stat.label}>
              <span className={`wm-stat__icon wm-stat__icon--${stat.tone}`}><stat.icon size={17} /></span>
              <div>
                <div className="wm-stat__label">{stat.label}</div>
                <div className="wm-stat__value">{loading ? "…" : stat.value}</div>
                <div className={`wm-stat__note wm-stat__note--${stat.noteTone}`}>{stat.note}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="wm-body">
          <div className="wm-col-main">
            <section className="wm-card">
              <div className="wm-card__head">
                <div>
                  <h3>Inventory Overview</h3>
                  <p className="wm-card__subtitle">Every row below comes from the products table.</p>
                </div>
                <span className="wm-live-chip"><i /> Live database</span>
              </div>

              <div className="wm-tabs">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={tab === item.key ? "wm-tab wm-tab--active" : "wm-tab"}
                    onClick={() => setTab(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="wm-toolbar">
                <div className="wm-toolbar__search">
                  <Search size={13} />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search items..."
                  />
                </div>
                <label className="wm-select-control wm-select-control--sm">
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <ChevronDown size={12} />
                </label>
                {(query || warehouseFilter !== "all" || categoryFilter !== "all" || tab !== "all") && (
                  <button
                    className="wm-btn-ghost"
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setWarehouseFilter("all");
                      setCategoryFilter("all");
                      setTab("all");
                    }}
                  >
                    <RotateCcw size={13} /> Clear filters
                  </button>
                )}
              </div>

              {loading ? (
                <div className="wm-empty"><RefreshCw className="wm-spin" size={20} /><b>Loading inventory...</b></div>
              ) : filteredItems.length === 0 ? (
                <div className="wm-empty"><Package size={22} /><b>No products match this view.</b><span>Try changing the filters or add a new item.</span></div>
              ) : (
                <div className="wm-table-scroll">
                  <table className="wm-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Warehouse</th>
                        <th>Stock</th>
                        <th>Reorder</th>
                        <th>Status</th>
                        <th>Value</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => {
                        const status = statusOf(item);
                        const pct = Math.min(
                          (Number(item.quantity) / Math.max(Number(item.reorderPoint) * 2, 1)) * 100,
                          100
                        );
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="wm-item">
                                <span className="wm-item__icon"><Package size={13} /></span>
                                <div><b>{item.name}</b><small>{item.category || "Uncategorized"} · {item.unit}</small></div>
                              </div>
                            </td>
                            <td className="wm-mono">{item.sku}</td>
                            <td>{item.warehouseName}</td>
                            <td>
                              <div className="wm-stockcell">
                                <b>{item.quantity} {item.unit}</b>
                                <div className="wm-stockbar">
                                  <div
                                    className={`wm-stockbar__fill wm-stockbar__fill--${STATUS_STYLES[status].tone}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>{item.reorderPoint}</td>
                            <td><span className={`wm-badge wm-badge--${STATUS_STYLES[status].tone}`}>{STATUS_STYLES[status].label}</span></td>
                            <td className="wm-mono">{formatRupiah(Number(item.unitPrice) * Number(item.quantity))}</td>
                            <td>
                              <div className="wm-row-actions">
                                <button className="wm-mini-action wm-mini-action--in" type="button" onClick={() => openMovement(item, "in")} title="Stock in">
                                  <PackagePlus size={13} /> In
                                </button>
                                <button className="wm-mini-action wm-mini-action--out" type="button" onClick={() => openMovement(item, "out")} title="Stock out">
                                  <PackageMinus size={13} /> Out
                                </button>
                                <button className="wm-ai-btn" type="button" onClick={() => handleForecast(item)}>
                                  <Sparkles size={13} /> Forecast
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="wm-pagination">
                <span>Showing <b>{filteredItems.length}</b> of <b>{items.length}</b> products</span>
                <span>Data updates after every stock transaction.</span>
              </div>
            </section>

            <section className="wm-card">
              <div className="wm-card__head">
                <div>
                  <h3>Stock Movement</h3>
                  <p className="wm-card__subtitle">Aggregated from real stock_movements records.</p>
                </div>
                <label className="wm-select-control wm-select-control--sm">
                  <SlidersHorizontal size={13} />
                  <select value={chartDays} onChange={(event) => setChartDays(Number(event.target.value))}>
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                  <ChevronDown size={12} />
                </label>
              </div>

              <div className="wm-chart-legend">
                <span><i className="wm-dot wm-dot--green" /> Inbound</span>
                <span><i className="wm-dot wm-dot--blue" /> Outbound</span>
                <span><i className="wm-dot wm-dot--purple" /> Adjustments</span>
              </div>

              <div className="wm-chart-wrap">
                <div className="wm-chart">
                  <div className="wm-chart__axis">
                    <span>{chartMax}</span><span>{Math.round(chartMax * 0.66)}</span><span>{Math.round(chartMax * 0.33)}</span><span>0</span>
                  </div>
                  <div className="wm-chart__bars">
                    {chartData.map((day) => (
                      <div className="wm-chart__col" key={day.key} title={`${day.label}: +${day.inbound} / -${day.outbound} / adj ${day.adj}`}>
                        <div className="wm-chart__stack">
                          <div className="wm-chart__seg wm-chart__seg--green" style={{ height: `${(day.inbound / chartMax) * 100}%` }} />
                          <div className="wm-chart__seg wm-chart__seg--blue" style={{ height: `${(day.outbound / chartMax) * 100}%` }} />
                          <div className="wm-chart__seg wm-chart__seg--purple" style={{ height: `${(day.adj / chartMax) * 100}%` }} />
                        </div>
                        <span className="wm-chart__label">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="wm-chart-summary">
                  <div className="wm-chart-summary__title">Real Summary</div>
                  <div className="wm-chart-summary__row"><span>Total Inbound</span><b className="wm-text-green">+{chartSummary.inbound}</b></div>
                  <div className="wm-chart-summary__row"><span>Total Outbound</span><b className="wm-text-red">-{chartSummary.outbound}</b></div>
                  <div className="wm-chart-summary__row"><span>Adjustments</span><b className="wm-text-purple">+{chartSummary.adjustments}</b></div>
                  <div className="wm-chart-summary__row wm-chart-summary__row--total"><span>Net Movement</span><b>{chartSummary.net >= 0 ? "+" : ""}{chartSummary.net}</b></div>
                </div>
              </div>
            </section>
          </div>

          <aside className="wm-col-side">
            <section className="wm-card">
              <div className="wm-card__head">
                <div>
                  <h3>Warehouse Status</h3>
                  <p className="wm-card__subtitle">Inventory health, not synthetic floor-space.</p>
                </div>
                <span className="wm-live-chip"><i /> Live</span>
              </div>

              {warehouseStatus.length === 0 ? (
                <div className="wm-empty wm-empty--compact"><WarehouseIcon size={20} /><b>No warehouse data.</b></div>
              ) : (
                <div className="wm-wh-list">
                  {warehouseStatus.map((warehouse) => {
                    const tone = warehouse.status === "Healthy" ? "green" : warehouse.status === "Attention" ? "amber" : "red";
                    return (
                      <button
                        className="wm-wh wm-wh--interactive"
                        key={warehouse.id}
                        type="button"
                        onClick={() => setWarehouseFilter(warehouse.id)}
                      >
                        <div className="wm-wh__head">
                          <span className="wm-wh__icon"><WarehouseIcon size={15} /></span>
                          <div>
                            <div className="wm-wh__title"><b>{warehouse.name}</b><span className={`wm-badge wm-badge--sm wm-badge--${tone}`}>{warehouse.status}</span></div>
                            <small className="wm-wh__address">{warehouse.address}</small>
                          </div>
                        </div>
                        <div className="wm-wh__usage">
                          <div className="wm-wh__usageRow"><span>Healthy SKU ratio</span><b>{warehouse.health}%</b></div>
                          <div className="wm-stockbar wm-stockbar--wh"><div className={`wm-stockbar__fill wm-stockbar__fill--${tone}`} style={{ width: `${warehouse.health}%` }} /></div>
                          <span className="wm-wh__space">{warehouse.totalProducts} SKUs · {warehouse.totalUnits} units on hand</span>
                        </div>
                        <div className="wm-wh__stats">
                          <div><span>In today</span><b>{warehouse.inbound}</b></div>
                          <div><span>Out today</span><b>{warehouse.outbound}</b></div>
                          <div><span>Attention</span><b>{warehouse.low}</b></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {warehouseFilter !== "all" && (
                <button className="wm-card__footer-button" type="button" onClick={() => setWarehouseFilter("all")}>Show all warehouses</button>
              )}
            </section>

            <section className="wm-card">
              <div className="wm-card__head">
                <div>
                  <h3>Recent Stock Activity</h3>
                  <p className="wm-card__subtitle">Loaded from movement audit records.</p>
                </div>
              </div>

              {recentActivities.length === 0 ? (
                <div className="wm-empty wm-empty--compact"><History size={20} /><b>No stock movement yet.</b></div>
              ) : (
                <div className="wm-activity-list">
                  {recentActivities.map((activity) => {
                    const meta = MOVEMENT_META[activity.type] || MOVEMENT_META.adjustment;
                    const Icon = meta.icon;
                    return (
                      <button
                        className="wm-activity wm-activity--interactive"
                        type="button"
                        key={activity.id}
                        onClick={() => {
                          const product = items.find((item) => item.id === activity.productId);
                          if (product) openMovement(product, activity.type === "out" ? "out" : "in");
                        }}
                      >
                        <span className={`wm-activity__icon wm-activity__icon--${meta.tone}`}><Icon size={14} /></span>
                        <div className="wm-activity__content">
                          <div className="wm-activity__text">{meta.label}: {meta.sign}{activity.quantity} {activity.unit} {activity.productName}</div>
                          <div className="wm-activity__sub">{activity.warehouseName}{activity.note ? ` · ${activity.note}` : ""}</div>
                        </div>
                        <span className="wm-activity__time">{formatTimeAgo(activity.createdAt)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      {addOpen && (
        <div className="wm-modal-overlay" onMouseDown={() => !addSaving && setAddOpen(false)}>
          <form className="wm-modal" onSubmit={handleAddItem} onMouseDown={(event) => event.stopPropagation()}>
            <div className="wm-modal__head">
              <div><span className="wm-modal__eyebrow"><PackagePlus size={14} /> Inventory</span><h3>Add New Item</h3><p>Create a real product record in the selected warehouse.</p></div>
              <button className="wm-forecast-close" type="button" onClick={() => setAddOpen(false)} disabled={addSaving}><X size={18} /></button>
            </div>

            <div className="wm-form-grid">
              <label className="wm-field wm-field--full"><span>Warehouse</span><select required value={addForm.warehouseId} onChange={(event) => setAddForm({ ...addForm, warehouseId: event.target.value })}><option value="">Select warehouse</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></label>
              <label className="wm-field"><span>SKU</span><input required minLength={2} value={addForm.sku} onChange={(event) => setAddForm({ ...addForm, sku: event.target.value })} placeholder="e.g. KB-009" /></label>
              <label className="wm-field"><span>Item Name</span><input required minLength={2} value={addForm.name} onChange={(event) => setAddForm({ ...addForm, name: event.target.value })} placeholder="Product name" /></label>
              <label className="wm-field"><span>Category</span><input value={addForm.category} onChange={(event) => setAddForm({ ...addForm, category: event.target.value })} placeholder="Electronics" /></label>
              <label className="wm-field"><span>Unit</span><input required value={addForm.unit} onChange={(event) => setAddForm({ ...addForm, unit: event.target.value })} placeholder="pcs" /></label>
              <label className="wm-field"><span>Initial Quantity</span><input type="number" min="0" required value={addForm.quantity} onChange={(event) => setAddForm({ ...addForm, quantity: event.target.value })} /></label>
              <label className="wm-field"><span>Reorder Point</span><input type="number" min="0" required value={addForm.reorderPoint} onChange={(event) => setAddForm({ ...addForm, reorderPoint: event.target.value })} /></label>
              <label className="wm-field wm-field--full"><span>Unit Price (Rp)</span><input type="number" min="0" required value={addForm.unitPrice} onChange={(event) => setAddForm({ ...addForm, unitPrice: event.target.value })} /></label>
            </div>

            <div className="wm-modal__actions"><button className="wm-btn-secondary" type="button" onClick={() => setAddOpen(false)} disabled={addSaving}>Cancel</button><button className="wm-btn-primary" type="submit" disabled={addSaving}>{addSaving ? <RefreshCw className="wm-spin" size={14} /> : <Plus size={14} />}{addSaving ? "Saving..." : "Add Item"}</button></div>
          </form>
        </div>
      )}

      {movementItem && (
        <div className="wm-modal-overlay" onMouseDown={() => !movementSaving && setMovementItem(null)}>
          <form className="wm-modal wm-modal--movement" onSubmit={handleMovement} onMouseDown={(event) => event.stopPropagation()}>
            <div className="wm-modal__head">
              <div><span className="wm-modal__eyebrow"><History size={14} /> Stock Movement</span><h3>{movementItem.name}</h3><p>{movementItem.sku} · {movementItem.warehouseName} · Current stock: <b>{movementItem.quantity} {movementItem.unit}</b></p></div>
              <button className="wm-forecast-close" type="button" onClick={() => setMovementItem(null)} disabled={movementSaving}><X size={18} /></button>
            </div>

            <div className="wm-movement-types">
              {[{ key: "in", label: "Stock In", icon: PackagePlus }, { key: "out", label: "Stock Out", icon: PackageMinus }, { key: "adjustment", label: "Adjustment +", icon: RefreshCw }].map((type) => (
                <button key={type.key} className={movementForm.type === type.key ? "wm-movement-type wm-movement-type--active" : "wm-movement-type"} type="button" onClick={() => setMovementForm({ ...movementForm, type: type.key })}><type.icon size={16} /><span>{type.label}</span></button>
              ))}
            </div>

            <div className="wm-form-grid">
              <label className="wm-field"><span>Quantity ({movementItem.unit})</span><input type="number" min="1" max={movementForm.type === "out" ? movementItem.quantity : undefined} required value={movementForm.quantity} onChange={(event) => setMovementForm({ ...movementForm, quantity: event.target.value })} /></label>
              <label className="wm-field wm-field--full"><span>Note</span><textarea rows="3" value={movementForm.note} onChange={(event) => setMovementForm({ ...movementForm, note: event.target.value })} placeholder="Reason / receiving reference / adjustment note..." /></label>
            </div>

            <div className="wm-movement-preview"><span>Stock after transaction</span><b>{Math.max(0, Number(movementItem.quantity) + (movementForm.type === "out" ? -Number(movementForm.quantity || 0) : Number(movementForm.quantity || 0)))} {movementItem.unit}</b></div>

            <div className="wm-modal__actions"><button className="wm-btn-secondary" type="button" onClick={() => setMovementItem(null)} disabled={movementSaving}>Cancel</button><button className="wm-btn-primary" type="submit" disabled={movementSaving || Number(movementForm.quantity) <= 0 || (movementForm.type === "out" && Number(movementForm.quantity) > Number(movementItem.quantity))}>{movementSaving ? <RefreshCw className="wm-spin" size={14} /> : <Check size={14} />}{movementSaving ? "Recording..." : "Record Movement"}</button></div>
          </form>
        </div>
      )}

      {forecastItem && (
        <div className="wm-forecast-overlay" onMouseDown={closeForecast}>
          <div className="wm-forecast-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="wm-forecast-modal__head">
              <div><div className="wm-forecast-eyebrow"><Sparkles size={13} /> AI Demand Forecast</div><h3>{forecastItem.name}</h3><p>{forecastItem.sku} · {forecastItem.warehouseName}</p></div>
              <button className="wm-forecast-close" onClick={closeForecast} aria-label="Close forecast"><X size={18} /></button>
            </div>

            {forecastLoading ? (
              <div className="wm-forecast-state"><RefreshCw className="wm-spin" size={22} /><b>AI is analyzing demand...</b><span>Using stock movement history and demand patterns.</span></div>
            ) : forecastError ? (
              <div className="wm-forecast-error"><AlertTriangle size={18} /><div><b>Forecast failed</b><span>{forecastError}</span></div></div>
            ) : forecastData ? (
              <>
                <div className="wm-forecast-grid">
                  <div className="wm-forecast-metric"><span>Current Stock</span><strong>{forecastData.currentStock}</strong><small>{forecastData.product?.unit || "unit"}</small></div>
                  <div className="wm-forecast-metric wm-forecast-metric--accent"><span>Predicted Demand</span><strong>{forecastData.forecast.predictedDemand}</strong><small>next day</small></div>
                  <div className="wm-forecast-metric"><span>Recommended Stock</span><strong>{forecastData.forecast.recommendedStock}</strong><small>incl. safety stock</small></div>
                  <div className="wm-forecast-metric"><span>Suggested Restock</span><strong>{forecastData.forecast.suggestedRestock}</strong><small>{forecastData.product?.unit || "unit"}</small></div>
                </div>
                <div className="wm-forecast-recommendation">
                  <span className="wm-forecast-recommendation__icon"><TrendingUp size={17} /></span>
                  <div><span>AI Recommendation</span><b>{forecastData.forecast.status === "critical" ? `Critical stock level. Restock ${forecastData.forecast.suggestedRestock} ${forecastData.product?.unit || "units"} as soon as possible.` : forecastData.forecast.status === "restock" ? `Demand is projected above current stock. Consider restocking ${forecastData.forecast.suggestedRestock} ${forecastData.product?.unit || "units"}.` : "Current inventory is sufficient for the predicted demand."}</b></div>
                  <span className={`wm-forecast-status wm-forecast-status--${forecastData.forecast.status}`}>{forecastData.forecast.status}</span>
                </div>
                <div className="wm-forecast-foot">Forecast date: <b>{forecastData.forecast.date}</b></div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}