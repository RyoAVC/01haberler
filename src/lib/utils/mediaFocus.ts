export function mediaFocus(value: unknown): { x: number; y: number } {
  const v = value as { focusX?: unknown; focusY?: unknown } | null;
  const coordinate = (n: unknown) => typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
  return { x: coordinate(v?.focusX), y: coordinate(v?.focusY) };
}
