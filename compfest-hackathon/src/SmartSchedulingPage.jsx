import React, { useEffect, useMemo, useState } from "react";
import "./SmartSchedulingPage.css";
import Sidebar from "./Sidebar.jsx";
import CreateScheduleModal from "./CreateScheduleModal.jsx";
import EditScheduleModal from "./EditScheduleModal.jsx";
import { scheduleApi } from "./lib/api.js";
import { useAuth } from "./context/AuthContext.jsx";

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

/* =========================================================
   CONFIG
========================================================= */

const DAY_START = 8 * 60;
const DAY_END = 18 * 60;
const DAY_RANGE = DAY_END - DAY_START;

const TIME_LABELS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
];

const DAY_KEYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

const DAY_LABELS = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];

const TYPE_STYLES = {
  delivery: {
    label: "Delivery",
    color: "blue",
  },

  pickup: {
    label: "Pickup",
    color: "green",
  },

  maintenance: {
    label: "Maintenance",
    color: "amber",
  },

  other: {
    label: "Other Task",
    color: "purple",
  },
};



/* =========================================================
   HELPERS
========================================================= */

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function eventStyle(timeRange) {
  const [start, end] = timeRange
    .split(" - ")
    .map(timeToMinutes);

  const safeStart = Math.max(start, DAY_START);
  const safeEnd = Math.min(end, DAY_END);

  const top =
    ((safeStart - DAY_START) / DAY_RANGE) * 100;

  const height =
    ((safeEnd - safeStart) / DAY_RANGE) * 100;

  return {
    top: `${Math.max(top, 0)}%`,
    height: `${Math.max(height, 6)}%`,
  };
}

function startOfWeek(date) {
  const result = new Date(date);

  const day = result.getDay();

  // Senin sebagai awal minggu.
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfWeek(date) {
  const result = startOfWeek(date);

  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);

  return result;
}

function formatTime(dateString) {
  if (!dateString) {
    return "-";
  }

  return new Date(dateString).toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

function formatDateForInput(dateString) {
  const date = new Date(dateString);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeForInput(dateString) {
  const date = new Date(dateString);

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatWeekRange(start, end) {
  const sameMonth =
    start.getMonth() === end.getMonth();

  const sameYear =
    start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${start.toLocaleDateString("en-US", {
      month: "long",
    })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getDate() === secondDate.getDate() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  );
}

function formatStatus(status) {
  switch (status) {
    case "planned":
      return "Scheduled";

    case "in_progress":
      return "In Progress";

    case "done":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "-";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "in_progress":
      return "ss-badge--amber";

    case "done":
      return "ss-badge--green";

    case "cancelled":
      return "ss-badge--red";

    default:
      return "ss-badge--blue";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SmartSchedulingPage() {
  const { accessToken, user } = useAuth();

  const [view, setView] = useState("Week");

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [schedules, setSchedules] = useState([]);

  const [loadingSchedules, setLoadingSchedules] =
    useState(true);

  const [scheduleError, setScheduleError] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    createModalOpen,
    setCreateModalOpen,
  ] = useState(false);

  const [
  selectedSchedule,
  setSelectedSchedule,
] = useState(null);

const [
  editModalOpen,
  setEditModalOpen,
] = useState(false);

const [
  openMenuId,
  setOpenMenuId,
] = useState(null);

const [
  deletingScheduleId,
  setDeletingScheduleId,
] = useState(null);

const [
  recommendation,
  setRecommendation,
] = useState(null);

const [
  recommendationLoading,
  setRecommendationLoading,
] = useState(false);

const [
  recommendationError,
  setRecommendationError,
] = useState("");

const [
  createScheduleInitialData,
  setCreateScheduleInitialData,
] = useState(null);

  /* =======================================================
     CURRENT WEEK
  ======================================================= */

  const weekStart = useMemo(() => {
    return startOfWeek(currentDate);
  }, [currentDate]);

  const weekEnd = useMemo(() => {
    return endOfWeek(currentDate);
  }, [currentDate]);

  /* =======================================================
     DAYS
  ======================================================= */

  const days = useMemo(() => {
    const today = new Date();

    return Array.from({ length: 7 }).map(
      (_, index) => {
        const date = new Date(weekStart);

        date.setDate(
          weekStart.getDate() + index
        );

        return {
          key: DAY_KEYS[date.getDay()],

          label:
            DAY_LABELS[date.getDay()],

          date: date.getDate(),

          fullDate: date,

          today: isSameDay(date, today),
        };
      }
    );
  }, [weekStart]);

  /* =======================================================
     LOAD SCHEDULES
  ======================================================= */

async function loadSchedules() {
  if (!accessToken) {
    return;
  }

  try {
    setLoadingSchedules(true);
    setScheduleError("");

    const response =
      await scheduleApi.calendar(
        accessToken,
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

    setSchedules(
      response.data || []
    );
  } catch (error) {
    console.error(
      "Gagal mengambil schedules:",
      error
    );

    setScheduleError(
      error.message ||
        "Gagal mengambil data jadwal."
    );
  } finally {
    setLoadingSchedules(false);
  }
}

useEffect(() => {
  loadSchedules();
}, [
  accessToken,
  weekStart,
  weekEnd,
]);
  /* =======================================================
     FILTERED SCHEDULES
  ======================================================= */

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchType =
        typeFilter === "all" ||
        schedule.type === typeFilter;

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      const matchSearch =
        !query ||
        schedule.title
          ?.toLowerCase()
          .includes(query) ||
        schedule.assignee?.name
          ?.toLowerCase()
          .includes(query) ||
        schedule.order?.destinationAddress
          ?.toLowerCase()
          .includes(query);

      return matchType && matchSearch;
    });
  }, [
    schedules,
    typeFilter,
    searchQuery,
  ]);

    /* =======================================================
     DELETE SCHEDULE
  ======================================================= */
async function handleDeleteSchedule(
  schedule
) {
  const confirmed =
    window.confirm(
      `Hapus jadwal "${schedule.title}"?`
    );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingScheduleId(
      schedule.id
    );

    setScheduleError("");

    await scheduleApi.remove(
      schedule.id,
      accessToken
    );

    await loadSchedules();
  } catch (error) {
    console.error(
      "Delete schedule error:",
      error
    );

    setScheduleError(
      error.message ||
        "Gagal menghapus schedule."
    );
  } finally {
    setDeletingScheduleId(
      null
    );

    setOpenMenuId(null);
  }
}
  /* =======================================================
     CONVERT DB SCHEDULE → CALENDAR EVENT
  ======================================================= */

  const events = useMemo(() => {
    return filteredSchedules.map(
      (schedule) => {
        const start = new Date(
          schedule.startTime
        );

        return {
          id: schedule.id,

          date: start,

          day:
            DAY_KEYS[start.getDay()],

          type: schedule.type,

          title: schedule.title,

          time: `${formatTime(
            schedule.startTime
          )} - ${formatTime(
            schedule.endTime
          )}`,

          who:
            schedule.assignee?.name ||
            "Unassigned",

          status: schedule.status,

          raw: schedule,
        };
      }
    );
  }, [filteredSchedules]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const today = new Date();

    const todaySchedules =
      schedules.filter((schedule) => {
        return isSameDay(
          new Date(schedule.startTime),
          today
        );
      });

    const completed =
      todaySchedules.filter(
        (schedule) =>
          schedule.status === "done"
      ).length;

    const inProgress =
      todaySchedules.filter(
        (schedule) =>
          schedule.status ===
          "in_progress"
      ).length;

    const completionRate =
      todaySchedules.length > 0
        ? Math.round(
            (completed /
              todaySchedules.length) *
              100
          )
        : 0;

    return [
      {
        icon: ListChecks,
        label: "Today's Tasks",
        value: todaySchedules.length,
        note: "Scheduled today",
        tone: "primary",
      },

      {
        icon: CheckCircle2,
        label: "Completed",
        value: completed,
        note: `${completionRate}% completed`,
        tone: "green",
      },

      {
        icon: Clock,
        label: "In Progress",
        value: inProgress,
        note: "Currently active",
        tone: "amber",
      },

      {
        icon: AlertTriangle,
        label: "Conflicts",
        value: 0,
        note: "Conflict prevention active",
        tone: "red",
      },
    ];
  }, [schedules]);

  /* =======================================================
     UPCOMING TASKS
  ======================================================= */

  const upcomingTasks = useMemo(() => {
    const now = new Date();

    return filteredSchedules
      .filter((schedule) => {
        return (
          new Date(schedule.endTime) >=
            now &&
          schedule.status !==
            "cancelled"
        );
      })
      .sort((a, b) => {
        return (
          new Date(a.startTime) -
          new Date(b.startTime)
        );
      })
      .slice(0, 5);
  }, [filteredSchedules]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function goToPreviousWeek() {
    const previous =
      new Date(currentDate);

    previous.setDate(
      previous.getDate() - 7
    );

    setCurrentDate(previous);
  }

  function goToNextWeek() {
    const next = new Date(currentDate);

    next.setDate(
      next.getDate() + 7
    );

    setCurrentDate(next);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleEditSchedule(schedule) { setSelectedSchedule(schedule); setEditModalOpen(true); setOpenMenuId(null); }
  
async function handleRecommendSlot() {
  try {
    setRecommendationLoading(
      true
    );

    setRecommendationError(
      ""
    );

    setRecommendation(null);

    const response =
      await scheduleApi.recommendBestSlot(
        {
          date:
            currentDate.toISOString(),

          durationMinutes: 60,
        },

        accessToken
      );

    setRecommendation(
      response.data
    );
  } catch (error) {
    console.error(
      "Recommend slot error:",
      error
    );

    setRecommendationError(
      error.message ||
        "Gagal mendapatkan rekomendasi."
    );
  } finally {
    setRecommendationLoading(
      false
    );
  }
}
  
  /* =======================================================
     JSX
  ======================================================= */

  return (
    <div className="ss-page">
      <Sidebar active="scheduling" />

      <main className="ss-main">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <div className="ss-topbar">
          <div>
            <h1>Smart Scheduling</h1>

            <p>
              Plan, assign, and optimize
              your operational tasks with AI.
            </p>
          </div>

          <div className="ss-topbar__right">
            {/* SEARCH */}

            <div className="ss-search">
              <Search size={14} />

              <input
                type="text"
                placeholder="Search schedules..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
              />

              <span className="ss-kbd">
                ⌘K
              </span>
            </div>

            {/* NOTIFICATION */}

            <button
              className="ss-icon-btn"
              aria-label="Notifikasi"
            >
              <Bell size={17} />

              <span className="ss-icon-btn__badge">
                3
              </span>
            </button>

            {/* MESSAGE */}

            <button
              className="ss-icon-btn"
              aria-label="Pesan"
            >
              <MessageSquare size={17} />
            </button>

            {/* USER */}

            <button className="ss-user">
              <span className="ss-user__avatar">
                <User size={14} />
              </span>

              <span className="ss-user__meta">
                <b>
                  {user?.name ||
                    "Admin User"}
                </b>

                <small>
                  {user?.role ||
                    "Admin"}
                </small>
              </span>

              <ChevronDown size={14} />
            </button>

            {/* CREATE */}

<button
  className="ss-btn-primary"
  onClick={() => {
    setCreateScheduleInitialData(null);
    setCreateModalOpen(true);
  }}
>
  <Plus size={15} />
  Create Schedule
</button>
          </div>
        </div>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div className="ss-filterbar">
          <button
            className="ss-filter"
            onClick={goToToday}
          >
            <Calendar size={14} />

            {currentDate.toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}
          </button>

          {/* TYPE FILTER */}

          <div>
            <button
              className="ss-filter"
              onClick={() => {
                const types = [
                  "all",
                  "delivery",
                  "pickup",
                  "maintenance",
                  "other",
                ];

                const currentIndex =
                  types.indexOf(
                    typeFilter
                  );

                const nextIndex =
                  (currentIndex + 1) %
                  types.length;

                setTypeFilter(
                  types[nextIndex]
                );
              }}
            >
              <Tag size={14} />

              {typeFilter === "all"
                ? "All Types"
                : TYPE_STYLES[
                    typeFilter
                  ]?.label}

              <ChevronDown size={12} />
            </button>
          </div>

          <button className="ss-filter">
            <User size={14} />
            All Assignees
            <ChevronDown size={12} />
          </button>

          <button className="ss-filter">
            <Building2 size={14} />
            All Warehouses
            <ChevronDown size={12} />
          </button>

          <div className="ss-filterbar__spacer" />

          <div className="ss-view-toggle">
            {[
              "Day",
              "Week",
              "Month",
            ].map((item) => (
              <button
                key={item}
                className={
                  view === item
                    ? "ss-view-toggle__btn ss-view-toggle__btn--active"
                    : "ss-view-toggle__btn"
                }
                onClick={() =>
                  setView(item)
                }
              >
                {item}
              </button>
            ))}
          </div>

          <button
            className="ss-filter"
            onClick={goToToday}
          >
            Today
          </button>
        </div>

        {/* =================================================
            LOADING / ERROR
        ================================================= */}

        {loadingSchedules && (
          <div
            style={{
              marginBottom: "12px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Loading schedules...
          </div>
        )}

        {scheduleError && (
          <div
            style={{
              marginBottom: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "13px",
            }}
          >
            {scheduleError}
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="ss-stats">
          {stats.map((stat) => (
            <div
              className="ss-stat"
              key={stat.label}
            >
              <span
                className={`ss-stat__icon ss-stat__icon--${stat.tone}`}
              >
                <stat.icon size={17} />
              </span>

              <div>
                <div className="ss-stat__label">
                  {stat.label}
                </div>

                <div className="ss-stat__value">
                  {stat.value}
                </div>

                <div
                  className={`ss-stat__note ss-stat__note--${stat.tone}`}
                >
                  {stat.note}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="ss-body">
          <div className="ss-calendar-wrap">
            {/* ===============================================
                CALENDAR NAVIGATION
            =============================================== */}

            <div className="ss-calendar-nav">
              <button
                aria-label="Minggu sebelumnya"
                onClick={
                  goToPreviousWeek
                }
              >
                <ChevronLeft size={16} />
              </button>

              <span>
                {formatWeekRange(
                  weekStart,
                  weekEnd
                )}
              </span>

              <button
                aria-label="Minggu berikutnya"
                onClick={goToNextWeek}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* ===============================================
                CALENDAR
            =============================================== */}

            <div className="ss-calendar">
              {/* TIME AXIS */}

              <div className="ss-calendar__axis">
                <div className="ss-calendar__corner" />

                {TIME_LABELS.map(
                  (time) => (
                    <div
                      className="ss-calendar__time"
                      key={time}
                    >
                      {time}
                    </div>
                  )
                )}
              </div>

              {/* WEEK GRID */}

              <div className="ss-calendar__grid">
                {days.map((day) => (
                  <div
                    className="ss-calendar__col"
                    key={
                      day.fullDate.toISOString()
                    }
                  >
                    {/* HEADER */}

                    <div className="ss-calendar__head">
                      <span>
                        {day.label}
                      </span>

                      <b
                        className={
                          day.today
                            ? "ss-calendar__date ss-calendar__date--today"
                            : "ss-calendar__date"
                        }
                      >
                        {day.date}
                      </b>
                    </div>

                    {/* EVENT LANE */}

                    <div className="ss-calendar__lane">
                      {TIME_LABELS.map(
                        (_, index) => (
                          <div
                            className="ss-calendar__gridline"
                            key={index}
                          />
                        )
                      )}

                      {events
                        .filter(
                          (event) =>
                            isSameDay(
                              event.date,
                              day.fullDate
                            )
                        )
                        .map(
                          (event) => {
                            const typeStyle =
                              TYPE_STYLES[
                                event.type
                              ] ||
                              TYPE_STYLES.other;

                            return (
<div
  key={event.id}
  className={`ss-event ss-event--${typeStyle.color}`}
  style={
    eventStyle(
      event.time
    )
  }
  title={`${event.title} | ${event.time} | ${event.who}`}
  onClick={() =>
    handleEditSchedule(
      event.raw
    )
  }
>
                                <span className="ss-event__title">
                                  {
                                    event.title
                                  }
                                </span>

                                <span className="ss-event__time">
                                  {
                                    event.time
                                  }
                                </span>

                                <span className="ss-event__who">
                                  {
                                    event.who
                                  }
                                </span>
                              </div>
                            );
                          }
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===============================================
                EMPTY STATE
            =============================================== */}

            {!loadingSchedules &&
              events.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "18px",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  Tidak ada jadwal pada
                  minggu ini.
                </div>
              )}

            {/* ===============================================
                UPCOMING TASKS
            =============================================== */}

            <div className="ss-upcoming">
              <div className="ss-upcoming__head">
                <h3>
                  Upcoming Tasks
                </h3>

                <button
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    cursor: "pointer",
                    color: "inherit",
                  }}
                  onClick={() => {
                    console.log(
                      "All schedules:",
                      schedules
                    );
                  }}
                >
                  View All →
                </button>
              </div>

              <table className="ss-table">
                <thead>
                  <tr>
                    <th>Time</th>

                    <th>Task</th>

                    <th>
                      Assignee
                    </th>

                    <th>
                      Warehouse /
                      Location
                    </th>

                    <th>Type</th>

                    <th>Status</th>

                    <th />
                  </tr>
                </thead>

                <tbody>
                  {upcomingTasks.map(
                    (schedule) => {
                      const typeStyle =
                        TYPE_STYLES[
                          schedule.type
                        ] ||
                        TYPE_STYLES.other;

                      return (
                        <tr
                          key={
                            schedule.id
                          }
                        >
                          <td className="ss-table__time">
                            {formatTime(
                              schedule.startTime
                            )}
                          </td>

                          {/* TASK */}

                          <td>
                            <div className="ss-table__task">
                              {
                                schedule.title
                              }
                            </div>

                            <div className="ss-table__sub">
                              {formatTime(
                                schedule.startTime
                              )}{" "}
                              –{" "}
                              {formatTime(
                                schedule.endTime
                              )}
                            </div>
                          </td>

                          {/* ASSIGNEE */}

                          <td>
                            <div className="ss-table__assignee">
                              <span className="ss-table__avatar">
                                <User
                                  size={
                                    12
                                  }
                                />
                              </span>

                              <div>
                                <div className="ss-table__task">
                                  {schedule
                                    .assignee
                                    ?.name ||
                                    "Unassigned"}
                                </div>

                                <div className="ss-table__sub">
                                  {schedule
                                    .assignee
                                    ?.role ||
                                    "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* LOCATION */}

                          <td>
                            {schedule.order
                              ?.destinationAddress ||
                              "-"}
                          </td>

                          {/* TYPE */}

                          <td>
                            <span
                              className={`ss-badge ss-badge--${typeStyle.color}`}
                            >
                              {
                                typeStyle.label
                              }
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={`ss-badge ${getStatusClass(
                                schedule.status
                              )}`}
                            >
                              {formatStatus(
                                schedule.status
                              )}
                            </span>
                          </td>

                          {/* MORE */}

<td>
  <div className="ss-action-menu">
    <button
      className="ss-table__more"
      aria-label="Schedule options"
      onClick={() => {
        setOpenMenuId(
          openMenuId ===
            schedule.id
            ? null
            : schedule.id
        );
      }}
    >
      <MoreVertical
        size={15}
      />
    </button>

    {openMenuId ===
      schedule.id && (
      <div className="ss-action-menu__dropdown">
        <button
          type="button"
          onClick={() =>
            handleEditSchedule(
              schedule
            )
          }
        >
          Edit Schedule
        </button>

        <button
          type="button"
          className="ss-action-menu__delete"
          disabled={
            deletingScheduleId ===
            schedule.id
          }
          onClick={() =>
            handleDeleteSchedule(
              schedule
            )
          }
        >
          {deletingScheduleId ===
          schedule.id
            ? "Deleting..."
            : "Delete Schedule"}
        </button>
      </div>
    )}
  </div>
</td>
                        </tr>
                      );
                    }
                  )}

                  {!loadingSchedules &&
                    upcomingTasks.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            textAlign:
                              "center",
                            padding:
                              "24px",
                            color:
                              "#64748b",
                          }}
                        >
                          No upcoming
                          tasks.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================
              AI ASSISTANT PANEL
          ================================================= */}

          <aside className="ss-ai">
            <div className="ss-ai__head">
              <span>
                <Sparkles size={15} />
                AI Scheduling
                Assistant
              </span>

              <ChevronDown size={14} />
            </div>

            {/* AI RECOMMENDATION */}

<div className="ss-ai-card ss-ai-card--green">
  <div className="ss-ai-card__title">
    <Lightbulb size={13} />
    Recommended
  </div>

  {!recommendation &&
    !recommendationLoading && (
      <p>
        Analyze all available drivers
        and find the best combination
        of workload and availability.
      </p>
    )}

  {recommendationLoading && (
    <p>
      Comparing drivers and available
      time slots...
    </p>
  )}

  {recommendation?.best && (
    <>
      <p className="ss-ai-card__strong">
        {
          recommendation.best
            .assigneeName
        }
      </p>

      <p className="ss-ai-card__time">
        {formatTime(
          recommendation.best
            .startTime
        )}
        {" - "}
        {formatTime(
          recommendation.best
            .endTime
        )}
      </p>

      <p>
        {
          recommendation.best
            .reason
        }
      </p>

      <p>
        Recommendation score:{" "}
        <strong>
          {
            recommendation.best
              .score
          }
          /100
        </strong>
      </p>
    </>
  )}

  {recommendationError && (
    <p
      style={{
        color: "#D1435B",
      }}
    >
      {recommendationError}
    </p>
  )}

  <button
    className="ss-ai-card__btn ss-ai-card__btn--green"
    onClick={
      handleRecommendSlot
    }
    disabled={
      recommendationLoading
    }
  >
    {recommendationLoading
      ? "Analyzing..."
      : recommendation
      ? "Recalculate"
      : "Find Best Slot"}
  </button>
</div>

            {/* CONFLICT */}

            <div className="ss-ai-card ss-ai-card--red">
              <div className="ss-ai-card__title">
                <AlertTriangle
                  size={13}
                />
                Conflict Detection
              </div>

              <p>
                Schedule conflicts are
                currently checked by the
                backend before a task is
                created or updated.
              </p>

              <button
                className="ss-ai-card__btn ss-ai-card__btn--red"
                disabled
              >
                No Active Conflict
              </button>
            </div>

            {/* SLOT */}

<div className="ss-ai-card ss-ai-card--blue">
  <div className="ss-ai-card__title">
    <Calendar size={13} />
    Best Suggested Slot
  </div>

  {recommendation?.best ? (
    <>
      <p className="ss-ai-card__strong">
        {
          recommendation.best
            .assigneeName
        }
      </p>

      <p className="ss-ai-card__time">
        {new Date(
          recommendation.best
            .startTime
        ).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        )}

        {" • "}

        {formatTime(
          recommendation.best
            .startTime
        )}

        {" - "}

        {formatTime(
          recommendation.best
            .endTime
        )}
      </p>

      <p>
        Workload:{" "}
        {
          recommendation.best
            .workloadMinutes
        }{" "}
        min
      </p>

      <p>
        Current tasks:{" "}
        {
          recommendation.best
            .taskCount
        }
      </p>

<button
  className="ss-ai-card__btn ss-ai-card__btn--blue"
  onClick={() => {
    const best =
      recommendation.best;

    setCreateScheduleInitialData({
      title: "",
      type: "delivery",

      assignedTo:
        best.assignedTo,

      date:
        formatDateForInput(
          best.startTime
        ),

      startTime:
        formatTimeForInput(
          best.startTime
        ),

      endTime:
        formatTimeForInput(
          best.endTime
        ),
    });

    setCreateModalOpen(true);
  }}
>
  Schedule This Slot
</button>
    </>
  ) : (
    <>
      <p className="ss-ai-card__strong">
        No recommendation yet
      </p>

      <p>
        Run AI recommendation to find
        the best driver and time slot.
      </p>

      <button
        className="ss-ai-card__btn ss-ai-card__btn--blue"
        disabled
      >
        Schedule This Slot
      </button>
    </>
  )}
</div>
{recommendation?.alternatives?.length > 0 && (
  <div className="ss-ai-card">
    <div className="ss-ai-card__title">
      Alternative Options
    </div>

    {recommendation.alternatives.map(
      (option) => (
        <div
          key={option.assignedTo}
          className="ss-ai-alternative"
        >
          <div>
            <div className="ss-ai-alternative__name">
              {option.assigneeName}
            </div>

            <div className="ss-ai-alternative__meta">
              {formatTime(option.startTime)}
              {" - "}
              {formatTime(option.endTime)}
              {" • Score "}
              {option.score}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateScheduleInitialData({
                title: "",
                type: "delivery",

                assignedTo: option.assignedTo,

                date: formatDateForInput(
                  option.startTime
                ),

                startTime: formatTimeForInput(
                  option.startTime
                ),

                endTime: formatTimeForInput(
                  option.endTime
                ),
              });

              setCreateModalOpen(true);
            }}
          >
            Use
          </button>
        </div>
      )
    )}
  </div>
)}
            <button
              className="ss-ai__footer"
              style={{
                border: "none",
                background:
                  "transparent",
                cursor: "pointer",
              }}
            >
              View All Insights →
            </button>
          </aside>
        </div>
      </main>
<CreateScheduleModal
  open={createModalOpen}
  initialData={
    createScheduleInitialData
  }
  onClose={() => {
    setCreateModalOpen(false);

    setCreateScheduleInitialData(
      null
    );
  }}
  onCreated={async (
    schedule
  ) => {
    setCreateScheduleInitialData(
      null
    );

    setCurrentDate(
      new Date(
        schedule.startTime
      )
    );

    await loadSchedules();
  }}
/>
      <EditScheduleModal
  open={editModalOpen}
  schedule={selectedSchedule}
  onClose={() => {
    setEditModalOpen(false);
    setSelectedSchedule(null);
  }}
  onUpdated={async (
    schedule
  ) => {
    setCurrentDate(
      new Date(
        schedule.startTime
      )
    );

    await loadSchedules();
  }}
/>
    </div>
  );
}