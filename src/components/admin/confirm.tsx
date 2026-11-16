"use client";

export function ConfirmSubmit({ label, message }: { label: string; message: string }) {
  return (
    <button
      className="btn btn-ghost"
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
