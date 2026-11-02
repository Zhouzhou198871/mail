"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认",
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-slate-900">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary flex-1">
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "处理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
