import { useEffect, useRef } from "react";

import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Loader2,
} from "lucide-react";

// ==========================================
// CONFIRM MODAL
// ==========================================

function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmButtonRef = useRef(null);
  const modalRef = useRef(null);

  // ========================================
  // MODAL EFFECTS
  // ========================================

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel?.();
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusableElements =
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );

        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last =
          focusableElements[focusableElements.length - 1];

        if (
          event.shiftKey &&
          document.activeElement === first
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
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

      previouslyFocused?.focus?.();
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  // ========================================
  // MODAL STYLES
  // ========================================

  const variants = {
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      button:
        "bg-amber-500 hover:bg-amber-400 text-slate-950",
    },

    danger: {
      icon: AlertTriangle,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      button:
        "bg-red-500 hover:bg-red-400 text-white",
    },

    success: {
      icon: CheckCircle,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      button:
        "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    },

    info: {
      icon: Info,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      button:
        "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
    },
  };

  const selectedVariant =
    variants[variant] || variants.warning;

  const Icon = selectedVariant.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-3 py-6 backdrop-blur-sm sm:px-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel?.();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queuex-confirm-title"
        aria-describedby="queuex-confirm-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50"
      >
        {/* MODAL HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5 sm:p-6">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${selectedVariant.iconBg}`}
          >
            <Icon
              size={24}
              className={selectedVariant.iconColor}
            />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close confirmation dialog"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL CONTENT */}

        <div className="p-5 sm:p-6">
          <h2
            id="queuex-confirm-title"
            className="text-xl font-bold text-white"
          >
            {title}
          </h2>

          <p
            id="queuex-confirm-description"
            className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-slate-400"
          >
            {message}
          </p>
        </div>

        {/* MODAL ACTIONS */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-950/40 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${selectedVariant.button}`}
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;