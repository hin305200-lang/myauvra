"use client";

import { useState } from "react";

type Result = { error?: string; ok?: boolean; link?: string | null } | void;

export function ActionForm({
  action,
  children,
  className,
  success = "Saved.",
}: {
  action: (formData: FormData) => Promise<Result>;
  children: React.ReactNode;
  className?: string;
  success?: string;
}) {
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  return (
    <form
      className={className}
      action={async (formData) => {
        setError("");
        setNote("");
        const result = await action(formData);
        if (result && "error" in result && result.error) setError(result.error);
        else if (result && result.link) setNote(result.link);
        else if (result && "ok" in result && result.ok) setNote(success);
      }}
    >
      {children}
      {error ? <p className="form-error">{error}</p> : null}
      {note ? (
        note.startsWith("http") ? (
          <p className="form-ok">
            Email is not configured. Use this one-time link: <a href={note}>{note}</a>
          </p>
        ) : (
          <p className="form-ok">{note}</p>
        )
      ) : null}
    </form>
  );
}
