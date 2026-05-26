import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}

export function NeuSlider({ value, onChange, min, max, step = 1 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  const set = useCallback((clientX: number) => {
    const t = trackRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, stepped)));
  }, [min, max, step, onChange]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => set(e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, set]);

  return (
    <div
      ref={trackRef}
      className="neu-deep rounded-full h-5 relative cursor-pointer select-none"
      onPointerDown={(e) => { setDragging(true); set(e.clientX); }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 left-0 h-3 rounded-full ml-1"
        style={{
          width: `calc(${pct}% - 8px)`,
          background: "var(--accent)",
          boxShadow: "-1px -1px 3px rgba(255,255,255,0.7), 1px 1px 3px rgba(108,99,255,0.4)",
          minWidth: 0,
        }}
      />
      <div
        className="absolute top-1/2 w-7 h-7 rounded-full -translate-y-1/2"
        style={{
          left: `calc(${pct}% - 14px)`,
          background: "var(--bg)",
          boxShadow: dragging ? "var(--neu-float)" : "var(--neu-raised)",
          transition: dragging ? "none" : "box-shadow 0.15s",
        }}
      />
    </div>
  );
}
