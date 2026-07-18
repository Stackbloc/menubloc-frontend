import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./presentation.css";
import { PRESENTATION_THEME } from "./theme.js";
import { usePresentationNavigation } from "./usePresentationNavigation.js";
import FullscreenButton from "./components/FullscreenButton.jsx";

function buildTransitionClass(transition, phase, direction) {
  const kind = transition || "fade";
  if (kind === "slide") {
    if (phase === "enter") {
      return direction === "forward"
        ? "mp-trans-slide-enter-forward mp-trans-slide-enter-active"
        : "mp-trans-slide-enter-back mp-trans-slide-enter-active";
    }
    return direction === "forward"
      ? "mp-trans-slide-exit-forward mp-trans-slide-exit-forward-active"
      : "mp-trans-slide-exit-back mp-trans-slide-exit-back-active";
  }
  if (kind === "scale") {
    return phase === "enter"
      ? "mp-trans-scale-enter mp-trans-scale-enter-active"
      : "mp-trans-scale-exit mp-trans-scale-exit-active";
  }
  return phase === "enter"
    ? "mp-trans-fade-enter mp-trans-fade-enter-active"
    : "mp-trans-fade-exit mp-trans-fade-exit-active";
}

/**
 * Reusable Menuply presentation engine.
 * Pass a slide registry from any deck (Demo, Investor, Restaurant, …).
 *
 * @param {{
 *   slides: Array<{ id: string, component: React.ComponentType, transition?: 'fade'|'slide'|'scale' }>,
 *   startIndex?: number,
 *   onIndexChange?: (index: number) => void,
 * }} props
 */
export default function PresentationEngine({ slides = [], startIndex = 0, onIndexChange }) {
  const rootRef = useRef(null);
  const count = slides.length;
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, startIndex), Math.max(0, count - 1))
  );
  const [direction, setDirection] = useState("forward");
  const [exiting, setExiting] = useState(null);
  const animatingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add("menuply-presentation-active");
    return () => {
      document.documentElement.classList.remove("menuply-presentation-active");
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  const commitIndex = useCallback(
    (next, dir) => {
      if (animatingRef.current || next === index || next < 0 || next >= count) return;
      animatingRef.current = true;
      setDirection(dir);
      setExiting({ index, transition: slides[index]?.transition || "fade" });
      setIndex(next);
      window.setTimeout(() => {
        setExiting(null);
        animatingRef.current = false;
      }, PRESENTATION_THEME.transitionMs + 20);
    },
    [index, count, slides]
  );

  const onPrev = useCallback(() => commitIndex(index - 1, "back"), [commitIndex, index]);
  const onNext = useCallback(() => commitIndex(index + 1, "forward"), [commitIndex, index]);

  usePresentationNavigation({
    index,
    count,
    onPrev,
    onNext,
    enabled: count > 0,
    rootRef,
  });

  const active = slides[index];
  const ActiveSlide = active?.component;

  const exitNode = useMemo(() => {
    if (!exiting) return null;
    const def = slides[exiting.index];
    if (!def) return null;
    const Comp = def.component;
    return (
      <div
        key={`exit-${exiting.index}`}
        className={`mp-presentation__slide mp-presentation__slide--exit ${buildTransitionClass(
          exiting.transition,
          "exit",
          direction
        )}`}
        aria-hidden="true"
      >
        <Comp />
      </div>
    );
  }, [exiting, slides, direction]);

  if (!count || !ActiveSlide) {
    return (
      <div className="mp-presentation" ref={rootRef}>
        <div style={{ margin: "auto", color: "#fff", fontWeight: 700 }}>No slides</div>
      </div>
    );
  }

  return (
    <div
      className="mp-presentation"
      ref={rootRef}
      role="application"
      aria-label="Menuply presentation"
    >
      <div className="mp-presentation__stage">
        {exitNode}
        <div
          key={`active-${active.id}`}
          className={`mp-presentation__slide mp-presentation__slide--active ${
            exiting
              ? buildTransitionClass(active.transition || "fade", "enter", direction)
              : ""
          }`}
        >
          <ActiveSlide />
        </div>
      </div>

      <button
        type="button"
        className="mp-presentation__nav-zone mp-presentation__nav-zone--prev"
        aria-label="Previous slide"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
      />
      <button
        type="button"
        className="mp-presentation__nav-zone mp-presentation__nav-zone--next"
        aria-label="Next slide"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      />

      <FullscreenButton targetRef={rootRef} />

      <div className="mp-presentation__sr" aria-live="polite">
        Slide {index + 1} of {count}
      </div>
    </div>
  );
}
