"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface TourStep {
  title: string;
  body: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface ProductTourProps {
  tourId: string;
  steps: TourStep[];
}

export function ProductTour({ tourId, steps }: ProductTourProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const startedRef = useRef(false);
  const storageKey = `described:tour-completed:${tourId}`;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setTimeout(() => setOpen(true), 400);
    }
    setViewport({ width: window.innerWidth, height: window.innerHeight });
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    const onResize = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const current = steps[step];
    if (!current?.target) {
      setRect(null);
      return;
    }

    const findAndMeasure = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-tour-id="${current.target}"]`
      );
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      requestAnimationFrame(() => {
        setRect(el.getBoundingClientRect());
      });
    };

    findAndMeasure();
    const onResize = () => findAndMeasure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, step, steps]);

  function finish() {
    localStorage.setItem(storageKey, "1");
    setOpen(false);
  }

  function next() {
    if (step >= steps.length - 1) finish();
    else setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  if (!open) return null;
  if (typeof document === "undefined") return null;
  if (steps.length === 0) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const useSpotlight = Boolean(current.target && rect);

  const tooltipPosition = useSpotlight
    ? computeTooltipPosition(rect!, current.placement ?? "bottom", viewport)
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {!useSpotlight && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={finish}
        />
      )}
      {useSpotlight && (
        <div
          className="absolute pointer-events-none rounded-xl transition-all duration-200"
          style={{
            left: rect!.left - 8,
            top: rect!.top - 8,
            width: rect!.width + 16,
            height: rect!.height + 16,
            boxShadow:
              "0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 0 2px rgba(13, 127, 255, 0.7)",
          }}
        />
      )}

      <div
        className="absolute w-[520px] max-w-[92vw] bg-card border border-border rounded-2xl shadow-2xl p-8"
        style={
          useSpotlight
            ? tooltipPosition!
            : {
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Tour · {step + 1} / {steps.length}
          </p>
          <button
            onClick={finish}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="font-serif text-3xl mb-3">{current.title}</h3>
        <p className="text-base text-muted-foreground leading-relaxed mb-7">
          {current.body}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-5 bg-primary" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={back}>
                Back
              </Button>
            )}
            {!isLast ? (
              <>
                <Button variant="ghost" size="sm" onClick={finish}>
                  Skip
                </Button>
                <Button size="sm" onClick={next}>
                  Next
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={finish}>
                Got it
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function computeTooltipPosition(
  rect: DOMRect,
  placement: "top" | "bottom" | "left" | "right",
  viewport: { width: number; height: number }
): { left: number; top: number } {
  const TOOLTIP_W = 520;
  const TOOLTIP_H = 260;
  const GAP = 20;

  let left: number;
  let top: number;

  switch (placement) {
    case "top":
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      top = rect.top - TOOLTIP_H - GAP;
      break;
    case "bottom":
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
      top = rect.bottom + GAP;
      break;
    case "left":
      left = rect.left - TOOLTIP_W - GAP;
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      break;
    case "right":
      left = rect.right + GAP;
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      break;
  }

  const padding = 12;
  left = Math.max(padding, Math.min(left, viewport.width - TOOLTIP_W - padding));
  top = Math.max(padding, Math.min(top, viewport.height - TOOLTIP_H - padding));

  return { left, top };
}

// Step definitions for each page tour.

export const DASHBOARD_TOUR: TourStep[] = [
  {
    title: "Welcome to Described",
    body: "A 90-second tour of how to record, process, and ask questions about your meetings.",
  },
  {
    title: "Navigate the app",
    body: "Dashboard, Meetings, and Settings live here. The sidebar collapses if you need more room.",
    target: "sidebar",
    placement: "right",
  },
  {
    title: "Your overview at a glance",
    body: "Total meetings, hours captured, action items, and what's scheduled today. All updates automatically as you record.",
    target: "stats-cards",
    placement: "bottom",
  },
  {
    title: "Three ways to add a meeting",
    body: "Upload a transcript, paste a Google Meet link, or chat with your meetings. The dock follows you on every page.",
    target: "bottom-dock",
    placement: "top",
  },
  {
    title: "Connect the Chrome extension",
    body: "Generate an API key in Settings, paste it into the extension, and your recordings will land here automatically.",
    target: "nav-settings",
    placement: "right",
  },
  {
    title: "You're all set",
    body: "Open Settings to generate your first API key, or jump in and try the Ask AI dock now.",
  },
];

export const MEETINGS_TOUR: TourStep[] = [
  {
    title: "All your meetings",
    body: "Every recording, uploaded transcript, and calendar import lives here. Click any row to see the structured notes.",
  },
  {
    title: "List or calendar view",
    body: "Toggle between a sortable list and a calendar grid. Your choice is remembered for the session.",
    target: "meetings-view-toggle",
    placement: "bottom",
  },
  {
    title: "Filter and search",
    body: "Filter by status, search by title, and jump straight to the meeting you're looking for.",
    target: "meetings-list",
    placement: "top",
  },
  {
    title: "Open a meeting",
    body: "Click any row to see the summary, transcript, action items, decisions, and play back the audio.",
  },
];
