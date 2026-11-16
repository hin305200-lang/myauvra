"use client";

import * as Dialog from "@radix-ui/react-dialog";

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content
          className="panel"
          style={{
            position: "fixed",
            zIndex: 70,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: wide ? "min(980px, calc(100% - 1.5rem))" : "min(520px, calc(100% - 1.5rem))",
            maxHeight: "90svh",
            overflow: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
            <Dialog.Title className="serif" style={{ fontSize: "2rem", margin: 0 }}>{title}</Dialog.Title>
            <Dialog.Close className="btn btn-ghost" aria-label="Close">Close</Dialog.Close>
          </div>
          <div style={{ marginTop: "1rem" }}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
