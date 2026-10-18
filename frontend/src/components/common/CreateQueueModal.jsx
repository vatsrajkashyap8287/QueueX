import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  X,
  Plus,
  Clock,
  FileText,
  ListOrdered,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ==========================================
// INITIAL FORM DATA
// ==========================================

const initialFormData = {
  name: "",
  description: "",
  averageServiceTime: "5",
};

// ==========================================
// CREATE QUEUE MODAL
// ==========================================

function CreateQueueModal({
  isOpen,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState(initialFormData);

  const [errors, setErrors] = useState({});

  const modalRef = useRef(null);
  const nameInputRef = useRef(null);

  // ========================================
  // RESET FORM WHEN MODAL OPENS
  // ========================================

  useEffect(() => {
    if (!isOpen) return;

    setFormData({ ...initialFormData });
    setErrors({});
  }, [isOpen]);

  // ========================================
  // KEYBOARD / BODY SCROLL HANDLING
  // ========================================

  const onCloseRef = useRef(onClose);
  const loadingRef = useRef(loading);

  useEffect(() => {
    onCloseRef.current = onClose;
    loadingRef.current = loading;
  }, [onClose, loading]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!loadingRef.current) {
          onCloseRef.current?.();
        }

        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;

      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];

      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);

      document.body.style.overflow = previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      previousActiveElement?.focus?.();
    };
  }, [isOpen]);

  // ========================================
  // INPUT HANDLING
  // ========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // ========================================
  // VALIDATION
  // ========================================

  const validateForm = () => {
    const newErrors = {};

    const queueName = formData.name.trim();

    const averageServiceTime = Number(
      formData.averageServiceTime
    );

    if (!queueName) {
      newErrors.name = "Queue name is required.";
    } else if (queueName.length < 3) {
      newErrors.name =
        "Queue name must contain at least 3 characters.";
    } else if (queueName.length > 100) {
      newErrors.name =
        "Queue name cannot exceed 100 characters.";
    }

    if (
      formData.averageServiceTime.trim() === "" ||
      !Number.isFinite(averageServiceTime) ||
      averageServiceTime < 1 ||
      !Number.isInteger(averageServiceTime)
    ) {
      newErrors.averageServiceTime =
        "Enter a valid whole number of minutes (minimum 1).";
    }

    if (averageServiceTime > 1440) {
      newErrors.averageServiceTime =
        "Service time cannot exceed 1440 minutes.";
    }

    if (formData.description.trim().length > 500) {
      newErrors.description =
        "Description cannot exceed 500 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (loading) return;

    if (!validateForm()) return;

    onSubmit({
      name: formData.name.trim(),

      description: formData.description.trim(),

      averageServiceTime: Number(
        formData.averageServiceTime
      ),
    });
  };

  // ========================================
  // OVERLAY CLICK
  // ========================================

  const handleOverlayClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !loading
    ) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  // ========================================
  // UI
  // ========================================

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-queue-title"
        aria-describedby="create-queue-description"
        className="my-auto w-full max-w-lg min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50"
      >
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
              <Plus
                size={24}
                className="text-cyan-400"
              />
            </div>

            <div className="min-w-0">
              <h2
                id="create-queue-title"
                className="text-xl font-bold text-white"
              >
                Create New Queue
              </h2>

              <p
                id="create-queue-description"
                className="mt-1 text-sm leading-relaxed text-slate-400"
              >
                Set up a queue and start managing customers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close create queue modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="max-h-[calc(100dvh-180px)] overflow-y-auto"
        >
          <div className="space-y-5 p-5 sm:p-6">

            {/* QUEUE NAME */}

            <div>
              <label
                htmlFor="queue-name"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"
              >
                <ListOrdered
                  size={16}
                  className="text-cyan-400"
                />

                Queue Name

                <span className="text-red-400">*</span>
              </label>

              <input
                ref={nameInputRef}
                id="queue-name"
                name="name"
                type="text"
                maxLength={100}
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g. General Consultation"
                aria-invalid={!!errors.name}
                aria-describedby={
                  errors.name ? "queue-name-error" : undefined
                }
                className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 ${
                  errors.name
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-700 focus:border-cyan-500"
                }`}
              />

              {errors.name && (
                <p
                  id="queue-name-error"
                  className="mt-2 flex items-center gap-2 text-xs text-red-400"
                >
                  <AlertCircle size={14} />

                  {errors.name}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}

            <div>
              <label
                htmlFor="queue-description"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"
              >
                <FileText
                  size={16}
                  className="text-cyan-400"
                />

                Description

                <span className="text-xs font-normal text-slate-500">
                  (Optional)
                </span>
              </label>

              <textarea
                id="queue-description"
                name="description"
                rows={3}
                maxLength={500}
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                placeholder="Describe the purpose of this queue..."
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description
                    ? "queue-description-error"
                    : undefined
                }
                className={`w-full resize-none rounded-xl border bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 ${
                  errors.description
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-700 focus:border-cyan-500"
                }`}
              />

              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  Provide details to help users identify this queue.
                </span>

                <span className="shrink-0 text-xs text-slate-500">
                  {formData.description.length}/500
                </span>
              </div>

              {errors.description && (
                <p
                  id="queue-description-error"
                  className="mt-2 text-xs text-red-400"
                >
                  {errors.description}
                </p>
              )}
            </div>

            {/* SERVICE TIME */}

            <div>
              <label
                htmlFor="queue-service-time"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200"
              >
                <Clock
                  size={16}
                  className="text-cyan-400"
                />

                Average Service Time

                <span className="text-red-400">*</span>
              </label>

              <div className="relative">
                <input
                  id="queue-service-time"
                  name="averageServiceTime"
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  value={formData.averageServiceTime}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="5"
                  aria-invalid={
                    !!errors.averageServiceTime
                  }
                  aria-describedby={
                    errors.averageServiceTime
                      ? "queue-service-time-error"
                      : undefined
                  }
                  className={`w-full rounded-xl border bg-slate-950 px-4 py-3 pr-20 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60 ${
                    errors.averageServiceTime
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-700 focus:border-cyan-500"
                  }`}
                />

                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-500">
                  minutes
                </span>
              </div>

              {errors.averageServiceTime ? (
                <p
                  id="queue-service-time-error"
                  className="mt-2 flex items-center gap-2 text-xs text-red-400"
                >
                  <AlertCircle size={14} />

                  {errors.averageServiceTime}
                </p>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Used to calculate estimated waiting times.
                </p>
              )}
            </div>

            {/* INFORMATION */}

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="flex items-start gap-3">
                <ListOrdered
                  size={18}
                  className="mt-0.5 shrink-0 text-cyan-400"
                />

                <div>
                  <p className="text-sm font-semibold text-cyan-400">
                    Queue will be active immediately
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Users can join this queue after creation.
                    You can pause or close it later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-900 p-5 sm:flex-row sm:justify-end sm:p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />

                  Create Queue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQueueModal;