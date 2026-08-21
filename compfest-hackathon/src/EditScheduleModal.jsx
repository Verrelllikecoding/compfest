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

function getDatePart(dateString) {
  if (!dateString) return "";

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

function getTimePart(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export default function EditScheduleModal({
  open,
  schedule,
  onClose,
  onUpdated,
}) {
  const { accessToken } = useAuth();

  const [form, setForm] = useState({
    title: "",
    type: "delivery",
    assignedTo: "",
    date: "",
    startTime: "",
    endTime: "",
    status: "planned",
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

  /* ================================================
     FILL EXISTING DATA
  ================================================ */

  useEffect(() => {
    if (!open || !schedule) return;

    setForm({
      title: schedule.title || "",
      type:
        schedule.type ||
        "delivery",

      assignedTo:
        schedule.assignedTo ||
        schedule.assignee?.id ||
        "",

      date: getDatePart(
        schedule.startTime
      ),

      startTime: getTimePart(
        schedule.startTime
      ),

      endTime: getTimePart(
        schedule.endTime
      ),

      status:
        schedule.status ||
        "planned",
    });

    setError("");
    setSuccess("");
  }, [open, schedule]);

  /* ================================================
     LOAD ASSIGNEES
  ================================================ */

  useEffect(() => {
    if (!open || !accessToken) return;

    async function loadAssignees() {
      try {
        setLoadingAssignees(true);

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
    }, [
      assignees,
      form.type,
    ]);

  if (!open || !schedule) {
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

    const start =
      new Date(
        `${form.date}T${form.startTime}`
      );

    const end =
      new Date(
        `${form.date}T${form.endTime}`
      );

    if (end <= start) {
      return "End time harus setelah start time.";
    }

    return null;
  }

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
        title:
          form.title.trim(),

        type:
          form.type,

        assignedTo:
          form.assignedTo,

        startTime:
          startDate.toISOString(),

        endTime:
          endDate.toISOString(),

        status:
          form.status,
      };

      const response =
        await scheduleApi.update(
          schedule.id,
          payload,
          accessToken
        );

      setSuccess(
        "Schedule berhasil diperbarui."
      );

      if (onUpdated) {
        await onUpdated(
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
            "Jadwal bentrok dengan jadwal lain."
        );

        return;
      }

      setError(
        err.message ||
          "Gagal memperbarui schedule."
      );
    } finally {
      setSubmitting(false);
    }
  }

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
              Edit Schedule
            </h2>

            <p>
              Update task, assignee,
              time, or status.
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

        <form
          className="ss-modal__form"
          onSubmit={handleSubmit}
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
                value={form.title}
                onChange={
                  handleChange
                }
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
                  Select assignee
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

          {/* TIMES */}

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

          {/* STATUS */}

          <label className="ss-form-field">
            <span>Status</span>

            <div className="ss-form-control">
              <CheckCircle2
                size={15}
              />

              <select
                name="status"
                value={form.status}
                onChange={
                  handleChange
                }
              >
                <option value="planned">
                  Planned
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="done">
                  Done
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>
            </div>
          </label>

          {/* ERROR */}

          {error && (
            <div className="ss-form-message ss-form-message--error">
              <AlertTriangle
                size={16}
              />

              <div>
                <strong>
                  Cannot update schedule
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

          {/* ACTION */}

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

                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={15}
                  />

                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}