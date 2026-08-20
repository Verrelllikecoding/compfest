import React, { useState } from "react";
import "./LandingPage.css";
import { Link } from "react-router-dom";
import HeroImg from "./assets/Landing.png";
import {
  Boxes,
  Menu,
  X,
  ChevronDown,
  Bell,
  Settings,
  User,
  Search,
  MessageSquare,
  ArrowRight,
  MapPin,
  Calendar,
  Route,
  Warehouse,
  CheckCircle2,
  BarChart3,
  Activity,
  ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  ⚠️  GANTI DI SINI                                                  */
/*  Taruh URL / path gambar gudang-mu sendiri di HERO_IMAGE.          */
/*  Kalau dikosongkan, otomatis pakai placeholder bergradasi.         */
/* ------------------------------------------------------------------ */
const HERO_IMAGE = HeroImg; // contoh: "/assets/warehouse-yard.jpg"

const NAV_LINKS = ["Command", "Flow", "Insights", "Reports"];
 
const OVERVIEW_ROWS = [
  { label: "Shipments Today", value: "103", dot: "amber" },
  { label: "Delivery Rate", value: "91%", dot: "teal" },
  { label: "Active Warehouses", value: "164", dot: "white" },
];
 
const ALERT_ROWS = [
  { label: "Late Shipments", value: "64.34" },
  { label: "Capacity Risk", value: "66.04" },
];
 
const TRACKING_STEPS = [
  { label: "Current Location", value: "Jeddah Port, Jeddah" },
  { label: "Departure", value: "Jeddah, Saudi Arabia" },
  { label: "Destination", value: "New York, NY" },
];
 
const PERF_BARS = [
  { h: 62, color: "amber" },
  { h: 88, color: "white" },
  { h: 74, color: "amber" },
  { h: 95, color: "white" },
];
 
// Placeholder nama partner — ganti dengan partner asli yang sudah
// memberi izin logonya dipakai (jangan pakai logo brand pihak ketiga
// seperti Nvidia/Microsoft tanpa kerja sama resmi).
const PARTNERS = [
  "Cloudline",
  "Nexora",
  "Vantage Freight",
  "Kargo Systems",
  "Meridian Logistics",
  "Trackly",
];
 
const HOW_STEPS = [
  {
    icon: Calendar,
    n: "01",
    title: "Jadwalkan tugas",
    desc: "Dispatcher menyusun jadwal pickup, delivery, atau maintenance. Bentrok terdeteksi otomatis sebelum jadi masalah di lapangan.",
  },
  {
    icon: Route,
    n: "02",
    title: "AI menyusun rute",
    desc: "Order digabung jadi batch, mesin optimasi menghitung urutan pemberhentian paling efisien untuk tiap kendaraan.",
  },
  {
    icon: Warehouse,
    n: "03",
    title: "Pantau & laporkan",
    desc: "Driver memperbarui status di lapangan, semua pihak melihat perubahan secara live, laporan siap diunduh kapan saja.",
  },
];
 
const CORE_MODULES = [
  {
    icon: Calendar,
    tag: "Scheduling",
    title: "Penjadwalan cerdas",
    desc: "Dispatcher membuat jadwal tugas dalam hitungan detik. Sistem otomatis mendeteksi bentrok dan menampilkan peringatan sebelum masalah terjadi.",
    points: [
      "Rekomendasi slot waktu dari AI berdasarkan beban kerja & ketersediaan armada",
      "Kalender bersama per gudang, bisa difilter per tipe & penanggung jawab",
      "Reminder otomatis 24 jam & 1 jam sebelum tugas dimulai",
    ],
    accent: "amber",
  },
  {
    icon: Route,
    tag: "AI Routing",
    title: "Optimasi rute pengiriman",
    desc: "Mesin optimasi berbasis OR-Tools menyusun urutan pemberhentian terbaik dari setiap batch pengiriman.",
    points: [
      "Mempertimbangkan jarak, kapasitas kendaraan, dan prioritas order",
      "ETA dihitung dari data jarak & durasi Maps API",
      "Re-routing otomatis saat order dibatalkan atau ditambahkan",
    ],
    accent: "primary",
  },
  {
    icon: Warehouse,
    tag: "Warehouse",
    title: "Gudang & stok real-time",
    desc: "Setiap pergerakan stok tercatat dengan pengguna dan waktu kejadian, sehingga siap diaudit kapan saja.",
    points: [
      "Kuantitas stok per produk per gudang terpantau live",
      "Notifikasi otomatis saat stok turun di bawah reorder point",
      "Riwayat pergerakan lengkap untuk setiap produk",
    ],
    accent: "teal",
  },
];
 
const SECONDARY_FEATURES = [
  {
    icon: BarChart3,
    title: "Laporan & analitik",
    desc: "Laporan stok dan performa pengiriman, siap diekspor ke PDF/Excel.",
  },
  {
    icon: Bell,
    title: "Notifikasi real-time",
    desc: "In-app lewat Socket.io, push notification mobile lewat Firebase.",
  },
  {
    icon: Activity,
    title: "Log aktivitas",
    desc: "Setiap kejadian tercatat dengan timestamp, read-only untuk audit.",
  },
  {
    icon: ShieldCheck,
    title: "Akses berbasis peran",
    desc: "Empat peran, empat batasan jelas — dicek langsung di server.",
  },
];
 
const STACK = [
  "Next.js",
  "Flutter",
  "Express.js",
  "FastAPI + OR-Tools",
  "PostgreSQL",
  "Socket.io",
  "Redis",
];
 
export default function OpseraExactHero() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Command");
  const [activeUtility, setActiveUtility] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [overviewPeriod, setOverviewPeriod] = useState("Today");
  const [compactMode, setCompactMode] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);

  const navContent = {
    Command: {
      title: "Command Center",
      text: "Ringkasan operasional hari ini — shipment, warehouse, dan alert dalam satu tampilan.",
      stats: ["103 shipments", "91% delivery rate", "164 warehouses"],
    },
    Flow: {
      title: "Live Logistic Flow",
      text: "Pantau pergerakan armada dan kapasitas jaringan logistik secara real-time.",
      stats: ["48% network load", "36 vehicles active", "12 routes optimized"],
    },
    Insights: {
      title: "Performance Insights",
      text: "Lihat tren performa, risiko keterlambatan, dan rekomendasi yang diprioritaskan AI.",
      stats: ["+8.4% efficiency", "3 risks detected", "17 AI suggestions"],
    },
    Reports: {
      title: "Operational Reports",
      text: "Ringkasan laporan terbaru untuk shipment, warehouse, dan penggunaan kapasitas.",
      stats: ["12 reports ready", "Last sync 2 min ago", "PDF / Excel"],
    },
  };

  const searchItems = [
    "Shipment #521-874-KPL",
    "Jeddah Port Warehouse",
    "Route JED → New York",
    "Late shipment report",
    "Capacity risk overview",
  ];

  const filteredSearch = searchItems.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openUtility = (name) => {
    setActiveUtility((current) => (current === name ? null : name));
  };

  const handleNavClick = (label) => {
    setActiveNav(label);
    setActiveUtility(label === "Command" ? null : "nav");
    setNavOpen(false);
  };

  const cycleOverviewPeriod = () => {
    const periods = ["Today", "This Week", "This Month"];
    const currentIndex = periods.indexOf(overviewPeriod);
    setOverviewPeriod(periods[(currentIndex + 1) % periods.length]);
  };

  return (
    <div className={`oh-root ${compactMode ? "oh-root--compact" : ""}`}>
      <section className="oh-stage">
        {/* ---------- background ---------- */}
        <div className="oh-bg">
          {HERO_IMAGE ? (
            <img src={HERO_IMAGE} alt="Operational logistics overview" className="oh-bg__img" />
          ) : (
            <div className="oh-bg__placeholder">
              <span>Taruh foto gudang / operasionalmu di sini</span>
              <code>const HERO_IMAGE = "url-gambarmu.jpg"</code>
            </div>
          )}
          <div className="oh-bg__scrim" />
          <div className="oh-blob oh-blob--a" />
          <div className="oh-blob oh-blob--b" />
          <div className="oh-blob oh-blob--c" />
        </div>

        {/* ---------- navbar ---------- */}
        <header className="oh-nav">
          <button className="oh-nav__logo oh-reset-btn" onClick={() => handleNavClick("Command")} aria-label="Kembali ke Command">
            <span className="oh-nav__mark">
              <Boxes size={17} strokeWidth={2.4} />
            </span>
            OPSERA
          </button>

          <nav className="oh-nav__pills" aria-label="Primary navigation">
            {NAV_LINKS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => handleNavClick(label)}
                className={`oh-pill ${activeNav === label ? "oh-pill--active" : ""}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="oh-nav__icons">
            <button
              type="button"
              className={`oh-icon-btn ${activeUtility === "search" ? "oh-icon-btn--active" : ""}`}
              aria-label="Cari"
              aria-expanded={activeUtility === "search"}
              onClick={() => openUtility("search")}
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              className={`oh-icon-btn ${activeUtility === "messages" ? "oh-icon-btn--active" : ""}`}
              aria-label="Pesan"
              aria-expanded={activeUtility === "messages"}
              onClick={() => openUtility("messages")}
            >
              <MessageSquare size={16} />
              <span className="oh-icon-badge">2</span>
            </button>
            <button
              type="button"
              className={`oh-icon-btn ${activeUtility === "notifications" ? "oh-icon-btn--active" : ""}`}
              aria-label="Notifikasi"
              aria-expanded={activeUtility === "notifications"}
              onClick={() => openUtility("notifications")}
            >
              <Bell size={16} />
              <span className="oh-icon-badge">3</span>
            </button>
            <button
              type="button"
              className={`oh-icon-btn ${activeUtility === "settings" ? "oh-icon-btn--active" : ""}`}
              aria-label="Pengaturan"
              aria-expanded={activeUtility === "settings"}
              onClick={() => openUtility("settings")}
            >
              <Settings size={16} />
            </button>
            <Link to="/login" className="oh-icon-btn oh-icon-btn--avatar" aria-label="Profil">
              <User size={16} />
            </Link>
          </div>

          <button className="oh-nav__toggle" onClick={() => setNavOpen((v) => !v)} aria-label="Menu">
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {navOpen && (
          <div className="oh-nav__mobile">
            {NAV_LINKS.map((label) => (
              <button
                type="button"
                key={label}
                className={activeNav === label ? "is-active" : ""}
                onClick={() => handleNavClick(label)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ---------- contextual navbar panel ---------- */}
        {activeUtility === "nav" && activeNav !== "Command" && (
          <div className="oh-context-panel" role="status">
            <div>
              <span className="oh-panel-kicker">{activeNav}</span>
              <strong>{navContent[activeNav].title}</strong>
              <p>{navContent[activeNav].text}</p>
            </div>
            <div className="oh-context-stats">
              {navContent[activeNav].stats.map((stat) => (
                <span key={stat}>{stat}</span>
              ))}
            </div>
            <button type="button" className="oh-panel-close" onClick={() => setActiveUtility(null)} aria-label="Tutup panel">
              <X size={15} />
            </button>
          </div>
        )}

        {/* ---------- utility popovers ---------- */}
        {activeUtility === "search" && (
          <div className="oh-utility-panel oh-utility-panel--search">
            <div className="oh-search-box">
              <Search size={15} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari shipment, route, warehouse..."
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} aria-label="Hapus pencarian">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="oh-panel-list">
              {(searchQuery ? filteredSearch : searchItems.slice(0, 3)).map((item) => (
                <button type="button" key={item} onClick={() => setSearchQuery(item)}>
                  <Search size={13} />
                  <span>{item}</span>
                </button>
              ))}
              {searchQuery && filteredSearch.length === 0 && <p className="oh-empty-state">Tidak ada hasil yang cocok.</p>}
            </div>
          </div>
        )}

        {activeUtility === "messages" && (
          <div className="oh-utility-panel">
            <div className="oh-utility-head">
              <strong>Messages</strong>
              <span>2 unread</span>
            </div>
            <div className="oh-panel-list">
              <button type="button"><span className="oh-list-dot" /><span><b>Dispatch Team</b><small>Route #18 sudah diperbarui.</small></span></button>
              <button type="button"><span className="oh-list-dot" /><span><b>Warehouse A</b><small>Loading selesai 8 menit lebih cepat.</small></span></button>
              <button type="button"><span><b>System</b><small>Daily sync berhasil.</small></span></button>
            </div>
          </div>
        )}

        {activeUtility === "notifications" && (
          <div className="oh-utility-panel">
            <div className="oh-utility-head">
              <strong>Notifications</strong>
              <button type="button" onClick={() => setActiveUtility(null)}>Mark read</button>
            </div>
            <div className="oh-panel-list">
              <button type="button"><span className="oh-alert-dot oh-alert-dot--coral" /><span><b>Late shipment risk</b><small>3 shipment perlu perhatian.</small></span></button>
              <button type="button"><span className="oh-alert-dot oh-alert-dot--amber" /><span><b>Capacity warning</b><small>Warehouse B mencapai 86%.</small></span></button>
              <button type="button"><span className="oh-alert-dot oh-alert-dot--teal" /><span><b>Optimization complete</b><small>12 route berhasil dioptimalkan.</small></span></button>
            </div>
          </div>
        )}

        {activeUtility === "settings" && (
          <div className="oh-utility-panel">
            <div className="oh-utility-head">
              <strong>Quick Settings</strong>
              <span>Hero demo</span>
            </div>
            <label className="oh-setting-row">
              <span><b>Live updates</b><small>Refresh operational cards automatically</small></span>
              <input type="checkbox" checked={liveUpdates} onChange={(e) => setLiveUpdates(e.target.checked)} />
            </label>
            <label className="oh-setting-row">
              <span><b>Compact cards</b><small>Reduce floating card spacing</small></span>
              <input type="checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
            </label>
          </div>
        )}

        {/* ---------- headline ---------- */}
        <div className="oh-copy">
          <span className="oh-eyebrow">AI-Powered Operations</span>
          <h1>
            Satu layar untuk
            <br />
            seluruh operasional Anda.
          </h1>
          <p>Jadwal, rute pengiriman, dan gudang — dipantau AI, secara real-time.</p>
          <Link to="/signup" className="oh-cta">
            Mulai Sekarang <ArrowRight size={15} />
          </Link>
        </div>

        {/* ---------- connector line + dot ---------- */}
        <svg className="oh-connector" viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true">
          <path id="oh-route" d="M615,330 C560,420 470,470 400,560" className="oh-connector__path" />
          <circle r="5" className="oh-connector__dot">
            <animateMotion dur={liveUpdates ? "3.6s" : "999s"} repeatCount="indefinite" rotate="auto">
              <mpath xlinkHref="#oh-route" />
            </animateMotion>
          </circle>
        </svg>

        {/* ---------- floating cards ---------- */}
        <div className="oh-card oh-card--shipments">
          <div className="oh-card__head"><span>Active Shipments</span></div>
          <div className="oh-progress"><div className="oh-progress__fill" style={{ width: "72%" }} /></div>
          <span className="oh-card__tag">72%</span>
        </div>

        <div className="oh-card oh-card--overview">
          <div className="oh-card__head">
            <span>Command Overview</span>
            <button type="button" className="oh-card__dropdown" onClick={cycleOverviewPeriod}>
              {overviewPeriod} <ChevronDown size={12} />
            </button>
          </div>
          {OVERVIEW_ROWS.map((r) => (
            <div className="oh-row" key={r.label}>
              <span className={`oh-dot oh-dot--${r.dot}`} />
              <span className="oh-row__label">{r.label}</span>
              <b>{r.value}</b>
            </div>
          ))}
        </div>

        <button type="button" className="oh-card oh-card--alert oh-card--button" onClick={() => openUtility("notifications")}>
          <div className="oh-card__head"><span>System Alert</span><span className="oh-card__tag oh-card__tag--dark">8m–8.5m</span></div>
          {ALERT_ROWS.map((r) => <div className="oh-row" key={r.label}><span className="oh-row__label">{r.label}</span><b>{r.value}</b></div>)}
        </button>

        <button type="button" className="oh-card oh-card--flow oh-card--button" onClick={() => handleNavClick("Flow")}>
          <div className="oh-card__head"><span>Live Logistic Flow</span></div>
          <div className="oh-flow-graph"><svg viewBox="0 0 200 60" preserveAspectRatio="none"><polyline points="0,45 25,30 50,38 75,15 100,28 125,10 150,22 175,8 200,18" className="oh-flow-graph__line" /></svg></div>
          <div className="oh-progress oh-progress--sm"><div className="oh-progress__fill" style={{ width: "48%" }} /></div>
          <span className="oh-card__meta">Available Space · 1016 / 2102</span>
        </button>

        <button type="button" className="oh-card oh-card--tracking oh-card--button" onClick={() => setActiveUtility("search")}>
          <div className="oh-card__head"><span>Tracking Details</span></div>
          <div className="oh-tracking__id"><span>#521-874-KPL</span><span className="oh-card__tag">In Transit</span></div>
          <div className="oh-tracking__steps">
            {TRACKING_STEPS.map((s, i) => (
              <div className="oh-tracking__step" key={s.label}>
                <span className={`oh-tracking__marker ${i === 0 ? "oh-tracking__marker--active" : ""}`} />
                <div><div className="oh-tracking__label">{s.label}</div><div className="oh-tracking__value">{s.value}</div></div>
              </div>
            ))}
          </div>
        </button>

        <button type="button" className="oh-card oh-card--perf oh-card--button" onClick={() => handleNavClick("Insights")}>
          <div className="oh-card__head"><span>Performance Insights</span></div>
          <div className="oh-bars">
            {PERF_BARS.map((b, i) => <div className="oh-bars__col" key={i}><div className={`oh-bars__bar oh-bars__bar--${b.color}`} style={{ height: `${b.h}%` }} /></div>)}
          </div>
        </button>
      </section>

      {/* ---------------- TRUSTED PARTNERS ---------------- */}
      <section className="oh-partners">
        <span className="oh-partners__label">Dipercaya tim operasional dari</span>
        <div className="oh-partners__row">
          {PARTNERS.map((p) => (
            <span className="oh-partners__logo" key={p}>
              {p}
            </span>
          ))}
        </div>
      </section>
 
      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="oh-how" id="cara-kerja">
        <div className="oh-how__head">
          <span className="oh-eyebrow-dark">Cara Kerja</span>
          <h2>Dari jadwal sampai laporan, tiga langkah</h2>
        </div>
 
        <div className="oh-how__steps">
          {HOW_STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="oh-how__step">
                <div className="oh-how__icon">
                  <s.icon size={20} strokeWidth={2} />
                </div>
                <div className="oh-how__number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
              {i < HOW_STEPS.length - 1 && <div className="oh-how__connector" />}
            </React.Fragment>
          ))}
        </div>
      </section>
 
      {/* ---------------- FEATURES ---------------- */}
      <section className="oh-features" id="fitur">
        <div className="oh-features__head">
          <span className="oh-eyebrow-dark oh-eyebrow-dark--onlight">Tiga Modul Inti</span>
          <h2>Semua yang tim operasional butuhkan, satu tempat</h2>
          <p>
            Bukan tiga aplikasi terpisah yang harus disatukan manual — Opsera
            merancangnya sebagai satu alur kerja sejak awal.
          </p>
        </div>
 
        <div className="oh-modules">
          {CORE_MODULES.map((m) => (
            <article className={`oh-module oh-module--${m.accent}`} key={m.title}>
              <div className="oh-module__icon">
                <m.icon size={20} strokeWidth={2} />
              </div>
              <span className="oh-module__tag">{m.tag}</span>
              <h3>{m.title}</h3>
              <p className="oh-module__desc">{m.desc}</p>
              <ul className="oh-module__points">
                {m.points.map((p) => (
                  <li key={p}>
                    <CheckCircle2 size={14} strokeWidth={2.4} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
 
        <div className="oh-secondary">
          {SECONDARY_FEATURES.map((f) => (
            <div className="oh-secondary__card" key={f.title}>
              <f.icon size={18} strokeWidth={2.2} />
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
 
      {/* ---------------- FOOTER ---------------- */}
      <footer className="oh-footer" id="kontak">
        <div className="oh-footer__inner">
          <div className="oh-footer__brand">
            <div className="oh-footer__logo">
              <span className="oh-footer__mark">
                <Boxes size={16} strokeWidth={2.4} />
              </span>
              OPSERA
            </div>
            <p>
              Platform operasional bertenaga AI untuk tim logistik dan gudang
              skala kecil-menengah.
            </p>
          </div>
 
          <div className="oh-footer__col">
            <span className="oh-footer__colTitle">Produk</span>
            <a href="#fitur">Fitur</a>
            <a href="#cara-kerja">Cara Kerja</a>
            <Link to="/signup">Demo</Link>
          </div>
 
          <div className="oh-footer__col">
            <span className="oh-footer__colTitle">Tim</span>
            <a href="#">Tentang</a>
            <a href="#">Kontak</a>
          </div>
        </div>
 
        <div className="oh-footer__bottom">
          <span>Opsera © 2026 — Tim ZEUS67</span>
          <span className="oh-footer__stack">Dibangun dengan {STACK.join(" · ")}</span>
        </div>
      </footer>
    </div>
  );
}
 