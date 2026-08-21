import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  scheduleApi,
  userApi,
} from "./lib/api.js";

import { useAuth } from "./context/AuthContext.jsx";

const INITIAL_FORM = {
  title: "",
  type: "delivery",
  assignedTo: "",
  date: "",
  startTime: "",
  endTime: "",
};

function getTodayInput() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CreateScheduleModal({
  open,
  onClose,
  onCreated,
  initialData = null,
}) {
  const { accessToken } = useAuth();

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    date: getTodayInput(),
  });

  const [assignees, setAssignees] =
    useState([]);

  const [
    loadingAssignees,
    setLoadingAssignees,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     LOAD ASSIGNEES
  ======================================================= */

  useEffect(() => {
    if (!open || !accessToken) {
      return;
    }

    async function loadAssignees() {
      try {
        setLoadingAssignees(true);
        setError("");

        const response =
          await userApi.assignees(
            accessToken
          );

        setAssignees(
          response.data || []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Gagal mengambil assignee."
        );
      } finally {
        setLoadingAssignees(false);
      }
    }

    loadAssignees();
  }, [open, accessToken]);

  /* =======================================================
     RESET WHEN OPEN
  ======================================================= */

useEffect(() => {
  if (!open) {
    return;
  }

  if (initialData) {
    setForm({
      title: initialData.title || "",
      type: initialData.type || "delivery",
      assignedTo:
        initialData.assignedTo || "",
      date:
        initialData.date ||
        getTodayInput(),
      startTime:
        initialData.startTime || "",
      endTime:
        initialData.endTime || "",
    });
  } else {
    setForm({
      ...INITIAL_FORM,
      date: getTodayInput(),
    });
  }

  setError("");
  setSuccess("");
}, [open, initialData]);

  /* =======================================================
     FILTER ASSIGNEES BASED ON TYPE
  ======================================================= */

  const availableAssignees =
    useMemo(() => {
      if (
        form.type === "delivery" ||
        form.type === "pickup"
      ) {
        return assignees.filter(
          (person) =>
            person.role === "driver"
        );
      }

      return assignees;
    }, [assignees, form.type]);

  if (!open) {
    return null;
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validate() {
    if (!form.title.trim()) {
      return "Title wajib diisi.";
    }

    if (!form.assignedTo) {
      return "Assignee wajib dipilih.";
    }

    if (!form.date) {
      return "Tanggal wajib dipilih.";
    }

    if (!form.startTime) {
      return "Start time wajib diisi.";
    }

    if (!form.endTime) {
      return "End time wajib diisi.";
    }

    const start = new Date(
      `${form.date}T${form.startTime}`
    );

    const end = new Date(
      `${form.date}T${form.endTime}`
    );

    if (end <= start) {
      return "End time harus setelah start time.";
    }

    return null;
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const startDate =
        new Date(
          `${form.date}T${form.startTime}`
        );

      const endDate =
        new Date(
          `${form.date}T${form.endTime}`
        );

      const payload = {
        title: form.title.trim(),
        type: form.type,
        assignedTo:
          form.assignedTo,
        startTime:
          startDate.toISOString(),
        endTime:
          endDate.toISOString(),
      };

      const response =
        await scheduleApi.create(
          payload,
          accessToken
        );

      setSuccess(
        "Schedule berhasil dibuat."
      );

      if (onCreated) {
        await onCreated(
          response.data
        );
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);

      if (err.status === 409) {
        setError(
          err.message ||
            "Schedule bentrok dengan jadwal lain."
        );

        return;
      }

      setError(
        err.message ||
          "Gagal membuat schedule."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <div
      className="ss-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="ss-modal">
        {/* HEADER */}

        <div className="ss-modal__header">
          <div>
            <h2>
              Create Schedule
            </h2>

            <p>
              Create and assign a new
              operational task.
            </p>
          </div>

          <button
            type="button"
            className="ss-modal__close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="ss-modal__form"
        >
          {/* TITLE */}

          <label className="ss-form-field">
            <span>
              Task Title
            </span>

            <div className="ss-form-control">
              <Calendar size={15} />

              <input
                type="text"
                name="title"
                placeholder="e.g. Morning Delivery"
                value={form.title}
                onChange={
                  handleChange
                }
                autoFocus
              />
            </div>
          </label>

          {/* TYPE */}

          <label className="ss-form-field">
            <span>
              Task Type
            </span>

            <div className="ss-form-control">
              <Tag size={15} />

              <select
                name="type"
                value={form.type}
                onChange={
                  handleChange
                }
              >
                <option value="delivery">
                  Delivery
                </option>

                <option value="pickup">
                  Pickup
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>
          </label>

          {/* ASSIGNEE */}

          <label className="ss-form-field">
            <span>
              Assignee
            </span>

            <div className="ss-form-control">
              <User size={15} />

              <select
                name="assignedTo"
                value={
                  form.assignedTo
                }
                onChange={
                  handleChange
                }
                disabled={
                  loadingAssignees
                }
              >
                <option value="">
                  {loadingAssignees
                    ? "Loading assignees..."
                    : "Select assignee"}
                </option>

                {availableAssignees.map(
                  (person) => (
                    <option
                      key={
                        person.id
                      }
                      value={
                        person.id
                      }
                    >
                      {person.name} —{" "}
                      {person.role.replace(
                        "_",
                        " "
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          </label>

          {/* DATE */}

          <label className="ss-form-field">
            <span>Date</span>

            <div className="ss-form-control">
              <Calendar size={15} />

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={
                  handleChange
                }
              />
            </div>
          </label>

          {/* TIME ROW */}

          <div className="ss-form-row">
            <label className="ss-form-field">
              <span>
                Start Time
              </span>

              <div className="ss-form-control">
                <Clock size={15} />

                <input
                  type="time"
                  name="startTime"
                  value={
                    form.startTime
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </label>

            <label className="ss-form-field">
              <span>
                End Time
              </span>

              <div className="ss-form-control">
                <Clock size={15} />

                <input
                  type="time"
                  name="endTime"
                  value={
                    form.endTime
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>
            </label>
          </div>

          {/* ERROR */}

          {error && (
            <div className="ss-form-message ss-form-message--error">
              <AlertTriangle
                size={16}
              />

              <div>
                <strong>
                  Cannot create
                  schedule
                </strong>

                <span>
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="ss-form-message ss-form-message--success">
              <CheckCircle2
                size={16}
              />

              <span>
                {success}
              </span>
            </div>
          )}

          {/* ACTIONS */}

          <div className="ss-modal__actions">
            <button
              type="button"
              className="ss-btn-secondary"
              onClick={onClose}
              disabled={
                submitting
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ss-btn-primary"
              disabled={
                submitting
              }
            >
              {submitting ? (
                <>
                  <Loader2
                    size={15}
                    className="ss-spin"
                  />

                  Creating...
                </>
              ) : (
                <>
                  <Calendar
                    size={15}
                  />

                  Create Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}