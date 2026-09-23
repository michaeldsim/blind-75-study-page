"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Pause, Play, Rotate } from "./icons";

interface Props {
  minutes: number;
  onElapsedChange?: (seconds: number) => void;
}

/**
 * Counts down from the configured budget, then keeps counting up in red --
 * knowing how far past 35 minutes you went is the useful signal, so it
 * doesn't just stop at zero.
 */
export default function Timer({ minutes, onElapsedChange }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      onElapsedChange?.(elapsedRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, onElapsedChange]);

  const budget = minutes * 60;
  const remaining = budget - elapsed;
  const overtime = remaining < 0;
  const shown = Math.abs(remaining);
  const label = `${overtime ? "+" : ""}${Math.floor(shown / 60)}:${String(shown % 60).padStart(2, "0")}`;

  return (
    <div className={`timer${running ? " running" : ""}${overtime ? " overtime" : ""}`}>
      <Clock />
      <span className="timer-display mono">{label}</span>
      <button
        className="timer-btn"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "Pause timer" : "Start timer"}
        title={running ? "Pause" : "Start"}
      >
        {running ? <Pause /> : <Play />}
      </button>
      <button
        className="timer-btn"
        onClick={() => {
          elapsedRef.current = 0;
          setElapsed(0);
          setRunning(false);
          onElapsedChange?.(0);
        }}
        aria-label="Reset timer"
        title="Reset"
      >
        <Rotate />
      </button>
    </div>
  );
}
