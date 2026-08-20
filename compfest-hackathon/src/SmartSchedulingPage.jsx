import React, { useState } from "react";
import "./SmartSchedulingPage.css";
import Sidebar from "./Sidebar.jsx";
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  Plus,
  Calendar,
  Tag,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  MoreVertical,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA (contoh — nanti diganti hasil GET /schedules/calendar)        */
/* ------------------------------------------------------------------ */

const DAY_START = 8 * 60; // 08:00 dalam menit
const DAY_END = 18 * 60; // 18:00 dalam menit
const DAY_RANGE = DAY_END - DAY_START;
const TIME_LABELS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

const DAYS = [
  { key: "mon", label: "MON", date: 4 },
  { key: "tue", label: "TUE", date: 5 },
  { key: "wed", label: "WED", date: 6 },
  { key: "thu", label: "THU", date: 7 },
  { key: "fri", label: "FRI", date: 8, today: true },
  { key: "sat", label: "SAT", date: 9 },
  { key: "sun", label: "SUN", date: 10 },
];

const TYPE_STYLES = {
  delivery: { label: "Delivery", color: "blue" },
  pickup: { label: "Pickup", color: "green" },
  maintenance: { label: "Maintenance", color: "amber" },
  other: { label: "Other Task", color: "purple" },
};

const EVENTS = [
  { day: "mon", type: "delivery", title: "Jakarta → WH B", time: "10:00 - 11:30", who: "Driver Andi" },
  { day: "mon", type: "maintenance", title: "Truck A-01", time: "14:00 - 15:30", who: "Rudi Hermawan" },
  { day: "tue", type: "pickup", title: "Warehouse A", time: "08:00 - 09:30", who: "Driver Dimas" },
  { day: "tue", type: "delivery", title: "Customer → WH C", time: "14:00 - 15:30", who: "Driver Budi" },
  { day: "wed", type: "delivery", title: "Warehouse B", time: "09:00 - 09:30", who: "Driver Andi" },
  { day: "wed", type: "pickup", title: "Warehouse C", time: "10:00 - 11:30", who: "Driver Rudi" },
  { day: "wed", type: "pickup", title: "Warehouse A", time: "14:00 - 15:30", who: "Driver Dimas" },
  { day: "wed", type: "maintenance", title: "Truck B-02", time: "16:00 - 17:30", who: "Rudi Hermawan" },
  { day: "thu", type: "delivery", title: "WH B → Customer", time: "10:00 - 11:30", who: "Driver Budi" },
  { day: "sat", type: "other", title: "Stock Opname", time: "13:00 - 15:00", who: "Warehouse A" },
];

const STATS = [
  { icon: ListChecks, label: "Today's Tasks", value: "24", note: "+4 from yesterday", tone: "primary" },
  { icon: CheckCircle2, label: "Completed", value: "16", note: "66.7% completed", tone: "green" },
  { icon: Clock, label: "In Progress", value: "5", note: "Currently active", tone: "amber" },
  { icon: AlertTriangle, label: "Conflicts", value: "3", note: "Needs attention", tone: "red" },
];

const UPCOMING = [
  {
    time: "10:00",
    task: "Delivery to Warehouse B",
    sub: "Jakarta → Warehouse B",
    assignee: "Budi Santoso",
    role: "Driver",
    location: "Warehouse B",
    type: "delivery",
    status: "Scheduled",
  },
  {
    time: "11:30",
    task: "Pickup from Warehouse A",
    sub: "Warehouse A",
    assignee: "Dimas Wijaya",
    role: "Driver",
    location: "Warehouse A",
    type: "pickup",
    status: "In Progress",
  },
  {
    time: "14:00",
    task: "Maintenance Truck A-02",
    sub: "Routine maintenance",
    assignee: "Rudi Hermawan",
    role: "Mechanic",
    location: "Warehouse A",
    type: "maintenance",
    status: "Scheduled",
  },
];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function eventStyle(timeRange) {
  const [start, end] = timeRange.split(" - ").map(timeToMinutes);
  const top = ((start - DAY_START) / DAY_RANGE) * 100;
  const height = ((end - start) / DAY_RANGE) * 100;
  return { top: `${top}%`, height: `${Math.max(height, 6)}%` };
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function SmartSchedulingPage() {
  const [view, setView] = useState("Week");

  return (
    <div className="ss-page">
      <Sidebar active="scheduling" />

      <main className="ss-main">
        {/* ---------------- top bar ---------------- */}
        <div className="ss-topbar">
          <div>
            <h1>Smart Scheduling</h1>
            <p>Plan, assign, and optimize your operational tasks with AI.</p>
          </div>

          <div className="ss-topbar__right">
            <div className="ss-search">
              <Search size={14} />
              <input type="text" placeholder="Search anything..." />
              <span className="ss-kbd">⌘K</span>
            </div>
            <button className="ss-icon-btn" aria-label="Notifikasi">
              <Bell size={17} />
              <span className="ss-icon-btn__badge">3</span>
            </button>
            <button className="ss-icon-btn" aria-label="Pesan">
              <MessageSquare size={17} />
            </button>
            <button className="ss-user">
              <span className="ss-user__avatar">
                <User size={14} />
              </span>
              <span className="ss-user__meta">
                <b>Admin User</b>
                <small>Super Admin</small>
              </span>
              <ChevronDown size={14} />
            </button>
            <button className="ss-btn-primary">
              <Plus size={15} /> Create Schedule
            </button>
          </div>
        </div>

        {/* ---------------- filter bar ---------------- */}
        <div className="ss-filterbar">
          <button className="ss-filter">
            <Calendar size={14} /> Today, August 8, 2026
          </button>
          <button className="ss-filter">
            <Tag size={14} /> All Types <ChevronDown size={12} />
          </button>
          <button className="ss-filter">
            <User size={14} /> All Assignees <ChevronDown size={12} />
          </button>
          <button className="ss-filter">
            <Building2 size={14} /> All Warehouses <ChevronDown size={12} />
          </button>

          <div className="ss-filterbar__spacer" />

          <div className="ss-view-toggle">
            {["Day", "Week", "Month"].map((v) => (
              <button
                key={v}
                className={view === v ? "ss-view-toggle__btn ss-view-toggle__btn--active" : "ss-view-toggle__btn"}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="ss-filter">Today</button>
        </div>

        {/* ---------------- stats ---------------- */}
        <div className="ss-stats">
          {STATS.map((s) => (
            <div className="ss-stat" key={s.label}>
              <span className={`ss-stat__icon ss-stat__icon--${s.tone}`}>
                <s.icon size={17} />
              </span>
              <div>
                <div className="ss-stat__label">{s.label}</div>
                <div className="ss-stat__value">{s.value}</div>
                <div className={`ss-stat__note ss-stat__note--${s.tone}`}>{s.note}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ---------------- calendar + AI panel ---------------- */}
        <div className="ss-body">
          <div className="ss-calendar-wrap">
            <div className="ss-calendar-nav">
              <button aria-label="Minggu sebelumnya">
                <ChevronLeft size={16} />
              </button>
              <span>August 4 – 10, 2026</span>
              <button aria-label="Minggu berikutnya">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="ss-calendar">
              <div className="ss-calendar__axis">
                <div className="ss-calendar__corner" />
                {TIME_LABELS.map((t) => (
                  <div className="ss-calendar__time" key={t}>
                    {t}
                  </div>
                ))}
              </div>

              <div className="ss-calendar__grid">
                {DAYS.map((d) => (
                  <div className="ss-calendar__col" key={d.key}>
                    <div className="ss-calendar__head">
                      <span>{d.label}</span>
                      <b className={d.today ? "ss-calendar__date ss-calendar__date--today" : "ss-calendar__date"}>
                        {d.date}
                      </b>
                    </div>
                    <div className="ss-calendar__lane">
                      {TIME_LABELS.map((_, i) => (
                        <div className="ss-calendar__gridline" key={i} />
                      ))}
                      {EVENTS.filter((e) => e.day === d.key).map((e, i) => (
                        <div
                          key={i}
                          className={`ss-event ss-event--${TYPE_STYLES[e.type].color}`}
                          style={eventStyle(e.time)}
                        >
                          <span className="ss-event__title">{e.title}</span>
                          <span className="ss-event__time">{e.time}</span>
                          <span className="ss-event__who">{e.who}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------------- upcoming tasks ---------------- */}
            <div className="ss-upcoming">
              <div className="ss-upcoming__head">
                <h3>Upcoming Tasks</h3>
                <a href="#">View All →</a>
              </div>
              <table className="ss-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Task</th>
                    <th>Assignee</th>
                    <th>Warehouse / Location</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {UPCOMING.map((u) => (
                    <tr key={u.task}>
                      <td className="ss-table__time">{u.time}</td>
                      <td>
                        <div className="ss-table__task">{u.task}</div>
                        <div className="ss-table__sub">{u.sub}</div>
                      </td>
                      <td>
                        <div className="ss-table__assignee">
                          <span className="ss-table__avatar">
                            <User size={12} />
                          </span>
                          <div>
                            <div className="ss-table__task">{u.assignee}</div>
                            <div className="ss-table__sub">{u.role}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.location}</td>
                      <td>
                        <span className={`ss-badge ss-badge--${TYPE_STYLES[u.type].color}`}>
                          {TYPE_STYLES[u.type].label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ss-badge ${
                            u.status === "In Progress" ? "ss-badge--amber" : "ss-badge--blue"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <button className="ss-table__more" aria-label="Opsi lain">
                          <MoreVertical size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------------- AI assistant panel ---------------- */}
          <aside className="ss-ai">
            <div className="ss-ai__head">
              <span>
                <Sparkles size={15} /> AI Scheduling Assistant
              </span>
              <ChevronDown size={14} />
            </div>

            <div className="ss-ai-card ss-ai-card--green">
              <div className="ss-ai-card__title">
                <Lightbulb size={13} /> Recommended
              </div>
              <p>
                Move Driver B's delivery from 14:00 → 15:30. This reduces
                workload overlap and improves fleet availability.
              </p>
              <button className="ss-ai-card__btn ss-ai-card__btn--green">Apply Recommendation</button>
            </div>

            <div className="ss-ai-card ss-ai-card--red">
              <div className="ss-ai-card__title">
                <AlertTriangle size={13} /> Schedule Conflict
              </div>
              <p>Driver B has two overlapping tasks at 14:00.</p>
              <button className="ss-ai-card__btn ss-ai-card__btn--red">Resolve Conflict</button>
            </div>

            <div className="ss-ai-card ss-ai-card--blue">
              <div className="ss-ai-card__title">
                <Calendar size={13} /> Suggested Slot
              </div>
              <p className="ss-ai-card__strong">Pickup at Warehouse A</p>
              <p className="ss-ai-card__time">10:30 – 11:15</p>
              <p>Based on current workload and vehicle availability.</p>
              <button className="ss-ai-card__btn ss-ai-card__btn--blue">Schedule This Slot</button>
            </div>

            <a href="#" className="ss-ai__footer">
              View All Insights →
            </a>
          </aside>
        </div>
      </main>
    </div>
  );
}