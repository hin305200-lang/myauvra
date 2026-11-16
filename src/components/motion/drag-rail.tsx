"use client";

import { useRef } from "react";

export function DragRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x: 0, left: 0 });
  return (
    <div
      className="drag-rail"
      ref={ref}
      onPointerDown={(event) => {
        if (!ref.current) return;
        drag.current = { active: true, x: event.clientX, left: ref.current.scrollLeft };
        ref.current.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current.active || !ref.current) return;
        ref.current.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
      }}
      onPointerUp={() => { drag.current.active = false; }}
      onPointerCancel={() => { drag.current.active = false; }}
    >
      <div className="drag-rail-track">{children}</div>
    </div>
  );
}
