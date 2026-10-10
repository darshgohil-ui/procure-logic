/**
 * Cursor-responsive micro-interaction hook.
 *
 * Implements subtle magnetic displacement and 3D card tilt towards the pointer.
 * Designed for maximum restraint (a few pixels/degrees) to avoid dizziness.
 * Automatically disabled on touch screens, mobile devices, and when
 * `prefers-reduced-motion` is active.
 */

import { useReducedMotion } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { useIsMobile } from "./useMobile";

export type MagneticBindings = {
  style: {
    x: number;
    y: number;
    rotateX?: number;
    rotateY?: number;
  };
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerLeave: () => void;
  setActive: (active: boolean) => void;
};

export type MagneticOptions = {
  strength?: number;
  tiltStrength?: number;
  enabled?: boolean;
};

/**
 * @param strength Max translation in px (default 6 — keep it quiet).
 * @param enabled Enable/disable the interaction.
 */
export function usePointerMagnetic<T extends HTMLElement = HTMLDivElement>(
  strengthOrOptions: number | MagneticOptions = 6,
  enabledParam = true
) {
  const options: MagneticOptions =
    typeof strengthOrOptions === "number"
      ? { strength: strengthOrOptions, enabled: enabledParam }
      : strengthOrOptions;

  const { strength = 6, tiltStrength = 0, enabled = true } = options;

  const frame = useRef<number | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();

  const active = enabled && !reduce && !isMobile;

  const reset = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setTransform({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
    });
  }, []);

  const setActive = useCallback((activeState: boolean) => {
    if (!active || !activeState) {
      reset();
    }
  }, [active, reset]);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!active) return;
    if (event.pointerType === "touch") return;

    const target = event.currentTarget as T;
    const bounds = target.getBoundingClientRect();
    const cx = bounds.left + bounds.width / 2;
    const cy = bounds.top + bounds.height / 2;
    const relX = (event.clientX - cx) / Math.max(bounds.width / 2, 1);
    const relY = (event.clientY - cy) / Math.max(bounds.height / 2, 1);

    const dx = relX * strength;
    const dy = relY * strength;
    const rx = -relY * tiltStrength;
    const ry = relX * tiltStrength;

    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setTransform({ x: dx, y: dy, rotateX: rx, rotateY: ry });
    });
  }, [active, strength, tiltStrength]);

  const onPointerLeave = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return {
    style: {
      x: transform.x,
      y: transform.y,
      ...(tiltStrength ? { rotateX: transform.rotateX, rotateY: transform.rotateY } : {}),
    },
    onPointerMove,
    onPointerLeave,
    setActive,
  } satisfies MagneticBindings;
}
