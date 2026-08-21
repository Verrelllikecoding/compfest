import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./RouteOptimizationPage.css";
import Sidebar from "./Sidebar.jsx";
import { Search, Bell, MessageSquare, ChevronDown, User, RotateCw, Plus, Calendar, Home, Sparkles, ArrowRight, GripVertical, MoreVertical, RefreshCw, X, CheckCircle2, SkipForward } from "lucide-react";
import { routeApi } from "./lib/api";
import { useAuth } from "./context/AuthContext.jsx";

const fmtKm = (v) => `${Number(v || 0).toFixed(1)} km`;
const fmtDuration = (m) => `${Math.floor((m || 0) / 60)}h ${(m || 0) % 60}m`;
const fmtTime = (v) => v ? new Date(v).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDateInput = () => new Date().toISOString().slice(0, 10);
const statusClass = (s) => s === "arrived" || s === "completed" ? "ro-badge--green" : s === "active" ? "ro-badge--blue" : "ro-badge--neutral";

function normalizePoints(route) {
  if (!route?.stops?.length) return [];
  const depot = route.stops[0].order.originWarehouse;
  const raw = [
    { id: "depot", type: "warehouse", name: depot.name, address: depot.address, lat: Number(depot.latitude), lng: Number(depot.longitude) },
    ...route.stops.map((s, i) => ({ id: s.id, type: "delivery", marker: i + 1, name: s.order.customerName, address: s.order.destinationAddress, lat: Number(s.order.destinationLat), lng: Number(s.order.destinationLng), stop: s })),
  ];
  const lats = raw.map((p) => p.lat), lngs = raw.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return raw.map((p) => ({ ...p, x: 10 + ((p.lng - minLng) / Math.max(maxLng - minLng, .001)) * 80, y: 85 - ((p.lat - minLat) / Math.max(maxLat - minLat, .001)) * 70 }));
}

export default function RouteOptimizationPage() {
  const { accessToken, user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [options, setOptions] = useState({ vehicles: [], drivers: [], orders: [] });
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", driverId: "", routeDate: fmtDateInput(), orderIds: [] });

  const load = useCallback(async (preserve = true) => {
    if (!accessToken) return;
    setLoading(true); setError("");
    try {
      const [r, o] = await Promise.all([routeApi.list(accessToken), routeApi.options(accessToken)]);
      const routeList = r.data || [];
      setRoutes(routeList); setOptions(o.data || { vehicles: [], drivers: [], orders: [] });
      setSelectedRouteId((prev) => preserve && routeList.some((x) => x.id === prev) ? prev : (routeList[0]?.id || ""));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { load(false); }, [load]);
  const route = useMemo(() => routes.find((r) => r.id === selectedRouteId) || routes[0] || null, [routes, selectedRouteId]);
  const points = useMemo(() => normalizePoints(route), [route]);
  const pathPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const filteredStops = useMemo(() => (route?.stops || []).filter((s) => `${s.order.customerName} ${s.order.destinationAddress}`.toLowerCase().includes(search.toLowerCase())), [route, search]);
  const selectedWeight = useMemo(() => options.orders.filter((o) => form.orderIds.includes(o.id)).reduce((a, o) => a + Number(o.weightKg || 1), 0), [options.orders, form.orderIds]);
  const vehicle = options.vehicles.find((v) => v.id === form.vehicleId);

  const openCreate = () => {
    const firstVehicle = options.vehicles[0];
    setForm({ vehicleId: firstVehicle?.id || "", driverId: firstVehicle?.driverId || options.drivers[0]?.id || "", routeDate: fmtDateInput(), orderIds: [] });
    setShowCreate(true);
  };
  const toggleOrder = (id) => setForm((f) => ({ ...f, orderIds: f.orderIds.includes(id) ? f.orderIds.filter((x) => x !== id) : [...f.orderIds, id] }));
  const generate = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { const res = await routeApi.generate(form, accessToken); setShowCreate(false); await load(false); setSelectedRouteId(res.data.id); }
    catch (e2) { setError(e2.message); }
    finally { setBusy(false); }
  };
  const action = async (fn) => { setBusy(true); setError(""); try { await fn(); await load(true); } catch (e) { setError(e.message); } finally { setBusy(false); } };

  return <div className="ro-page">
    <Sidebar active="routes" />
    <main className="ro-main">
      <div className="ro-topbar">
        <div><h1>Route Optimization</h1><p>AI-powered route planning backed by live orders, vehicles, drivers, and route stops.</p></div>
        <div className="ro-topbar__right">
          <div className="ro-search"><Search size={14}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search customer/address..."/></div>
          <button className="ro-icon-btn"><Bell size={17}/></button><button className="ro-icon-btn"><MessageSquare size={17}/></button>
          <button className="ro-user"><span className="ro-user__avatar"><User size={14}/></span><span className="ro-user__meta"><b>{user?.name || "User"}</b><small>{user?.role || ""}</small></span><ChevronDown size={14}/></button>
        </div>
      </div>

      {error && <div className="ro-alert">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}

      <div className="ro-filterbar">
        <div className="ro-field"><label>Route</label><select value={route?.id || ""} onChange={(e)=>setSelectedRouteId(e.target.value)}><option value="">No route</option>{routes.map((r,i)=><option key={r.id} value={r.id}>Route #{String(routes.length-i).padStart(3,"0")} · {r.vehicle.plateNumber}</option>)}</select></div>
        <div className="ro-field"><label>Date</label><button><Calendar size={13}/>{route ? new Date(route.routeDate).toLocaleDateString("id-ID") : "—"}</button></div>
        <div className="ro-field"><label>Vehicle</label><button>{route?.vehicle?.plateNumber || "—"}</button></div>
        <div className="ro-field"><label>Driver</label><button><User size={12}/>{route?.driver?.name || "—"}</button></div>
        <div className="ro-filterbar__actions">
          <button className="ro-btn-outline" disabled={!route || busy} onClick={()=>action(()=>routeApi.reoptimize(route.id, accessToken))}><RotateCw size={14}/> Re-optimize Route</button>
          <button className="ro-btn-primary" onClick={openCreate}><Plus size={15}/> Create New Route</button>
          <button className="ro-icon-btn" onClick={()=>load(true)} disabled={loading}><RefreshCw size={15}/></button>
        </div>
      </div>

      {!route ? <div className="ro-empty"><Sparkles size={26}/><h3>No route yet</h3><p>Create a route from pending orders to start optimization.</p><button className="ro-btn-primary" onClick={openCreate}><Plus size={15}/> Create New Route</button></div> : <>
        <div className="ro-body">
          <div className="ro-card ro-map-card"><div className="ro-map">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ro-map__bg"><rect width="100" height="100" fill="#E9EFF4"/><line x1="0" y1="20" x2="100" y2="15" className="ro-map__road"/><line x1="10" y1="0" x2="30" y2="100" className="ro-map__road"/><line x1="0" y1="60" x2="100" y2="55" className="ro-map__road"/><line x1="60" y1="0" x2="55" y2="100" className="ro-map__road"/></svg>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="ro-map__route"><polyline points={pathPoints} className="ro-map__routeline"/></svg>
            {points.map((p)=><div title={p.name} key={p.id} className={`ro-marker ro-marker--${p.type === "warehouse" ? "blue" : "green"}`} style={{left:`${p.x}%`,top:`${p.y}%`}}>{p.type === "warehouse" ? <Home size={13}/> : p.marker}</div>)}
            <div className="ro-legend"><div className="ro-legend__title">Live Route</div><div className="ro-legend__row"><span className="ro-legend__icon ro-legend__icon--blue"><Home size={11}/></span> Warehouse</div><div className="ro-legend__row"><span className="ro-legend__dot ro-legend__dot--green"/> Delivery Stop</div><div className="ro-legend__row"><span className="ro-legend__line"/> Optimized order</div></div>
          </div></div>
          <aside className="ro-card ro-summary"><div className="ro-summary__head"><h3>Route Summary</h3><span className="ro-badge-ai">{route.optimizedByAi ? "OR-Tools AI" : "Fallback Optimized"}</span></div>
            <div className="ro-summary__grid"><div><span>Total Distance</span><b>{fmtKm(route.totalDistanceKm)}</b></div><div><span>Estimated Time</span><b>{fmtDuration(route.totalDurationMin)}</b></div><div><span>Total Stops</span><b>{route.stops.length}</b></div><div><span>Status</span><b>{route.status}</b></div><div><span>Vehicle</span><b>{route.vehicle.plateNumber}</b></div><div><span>Driver</span><b>{route.driver.name}</b></div></div>
            <div className="ro-ai-box"><div className="ro-ai-box__title"><Sparkles size={13}/> AI Recommendation</div><p>Stops are sequenced from live destination coordinates. Re-optimize whenever pending stops change.</p><button onClick={()=>action(()=>routeApi.reoptimize(route.id, accessToken))}>Optimize Again <ArrowRight size={13}/></button></div>
            <div className="ro-route-actions">{route.status === "planned" && <button className="ro-btn-primary" onClick={()=>action(()=>routeApi.updateStatus(route.id,"active",accessToken))}>Start Route</button>}{route.status === "active" && <button className="ro-btn-primary" onClick={()=>action(()=>routeApi.updateStatus(route.id,"completed",accessToken))}>Complete Route</button>}</div>
          </aside>
        </div>

        <div className="ro-bottom"><div className="ro-card"><div className="ro-card__head"><h3>Route Stops ({route.stops.length})</h3><span className="ro-live-chip">LIVE DATABASE</span></div>
          <table className="ro-table"><thead><tr><th></th><th>#</th><th>Location</th><th>Priority</th><th>Weight</th><th>ETA</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredStops.map((s)=><tr key={s.id}><td className="ro-table__grip"><GripVertical size={13}/></td><td className="ro-mono">{s.sequenceNo}</td><td><div className="ro-table__loc">{s.order.customerName}</div><div className="ro-table__sub">{s.order.destinationAddress}</div></td><td>{s.order.priority}</td><td>{Number(s.order.weightKg || 1).toFixed(0)} kg</td><td className="ro-mono">{fmtTime(s.eta)}</td><td><span className={`ro-badge ${statusClass(s.status)}`}>{s.status}</span></td><td><div className="ro-stop-actions"><button disabled={busy || s.status === "arrived"} title="Arrived" onClick={()=>action(()=>routeApi.updateStopStatus(route.id,s.id,"arrived",accessToken))}><CheckCircle2 size={15}/></button><button disabled={busy || s.status === "skipped"} title="Skip" onClick={()=>action(()=>routeApi.updateStopStatus(route.id,s.id,"skipped",accessToken))}><SkipForward size={15}/></button><button className="ro-more"><MoreVertical size={14}/></button></div></td></tr>)}</tbody></table>
        </div></div>
      </>}

      {showCreate && <div className="ro-modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setShowCreate(false)}}><form className="ro-modal" onSubmit={generate}><div className="ro-modal__head"><div><h3>Create Optimized Route</h3><p>Select vehicle, driver, and pending orders.</p></div><button type="button" onClick={()=>setShowCreate(false)}><X size={18}/></button></div>
        <div className="ro-form-grid"><label>Route Date<input type="date" value={form.routeDate} onChange={(e)=>setForm({...form,routeDate:e.target.value})} required/></label><label>Vehicle<select value={form.vehicleId} onChange={(e)=>{const v=options.vehicles.find(x=>x.id===e.target.value);setForm({...form,vehicleId:e.target.value,driverId:v?.driverId || form.driverId})}} required><option value="">Select vehicle</option>{options.vehicles.map(v=><option value={v.id} key={v.id}>{v.plateNumber} · {v.type} · {Number(v.capacityKg)} kg</option>)}</select></label><label>Driver<select value={form.driverId} onChange={(e)=>setForm({...form,driverId:e.target.value})} required><option value="">Select driver</option>{options.drivers.map(d=><option value={d.id} key={d.id}>{d.name}</option>)}</select></label></div>
        <div className="ro-order-picker__head"><b>Pending Orders</b><span>{form.orderIds.length} selected · {selectedWeight.toFixed(0)} / {Number(vehicle?.capacityKg || 0).toFixed(0)} kg</span></div>
        <div className="ro-order-picker">{options.orders.length ? options.orders.map(o=><label className={`ro-order-option ${form.orderIds.includes(o.id)?"is-selected":""}`} key={o.id}><input type="checkbox" checked={form.orderIds.includes(o.id)} onChange={()=>toggleOrder(o.id)}/><span><b>{o.customerName}</b><small>{o.destinationAddress}</small></span><em>{o.priority}<br/>{Number(o.weightKg||1)} kg</em></label>) : <p>No pending orders.</p>}</div>
        <div className="ro-modal__actions"><button type="button" className="ro-btn-outline" onClick={()=>setShowCreate(false)}>Cancel</button><button type="submit" className="ro-btn-primary" disabled={busy || !form.orderIds.length || selectedWeight > Number(vehicle?.capacityKg || Infinity)}>{busy ? "Optimizing..." : "Generate AI Route"}</button></div>
      </form></div>}
    </main>
  </div>;
}
