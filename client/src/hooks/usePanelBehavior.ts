/**
 * Shared overlay behavior: Escape-to-close, focus capture on open, focus
 * restore on close, and body scroll locking.
 *
 * Designed for drawers / modals / panels rendered at the root of the app so
 * one hook keeps their behaviour consistent and accessible.
 */

import { useEffect, useRef } from "react";

export function usePanelBehavior(onClose: () => void, deps: unknown[] = []) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scope = drawerRef.current;

    // Delay focus so the exit animation doesn't fight the mount.
    const focusTimer = window.setTimeout(() => {
      const focusTarget = scope?.querySelector<HTMLElement>(
        '[data-autofocus], [autofocus], button, input, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusTarget ?? scope)?.focus?.();
    }, 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === "Tab" && scope) {
        const focusables = Array.from(
          scope.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === scope || active === document.body)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return drawerRef;
}