import { useEffect, useState } from "react";

export function useIdle(timeoutMs: number, warningMs: number) {
  const [warn, setWarn] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let warnT: ReturnType<typeof setTimeout>;
    let expireT: ReturnType<typeof setTimeout>;
    const reset = () => {
      setWarn(false);
      setExpired(false);
      clearTimeout(warnT);
      clearTimeout(expireT);
      warnT = setTimeout(() => setWarn(true), timeoutMs - warningMs);
      expireT = setTimeout(() => setExpired(true), timeoutMs);
    };
    const events = ["mousemove", "keydown", "touchstart", "pointerdown"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearTimeout(warnT); clearTimeout(expireT);
    };
  }, [timeoutMs, warningMs]);

  const dismiss = () => setWarn(false);
  return { warn, expired, dismiss };
}
