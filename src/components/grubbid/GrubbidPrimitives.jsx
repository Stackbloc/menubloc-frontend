/* ============================================================
   Grubbid Canonical Design System Lock
   These primitives are the required public-page entry points for
   Grubbid typography, spacing, cards, buttons, inputs, and layout.

   Do not add page-level typography or core visual styling here
   without explicit approval from Andre.

   If a page appears visually inconsistent, refactor the page to
   consume these primitives instead of overriding them locally.
   ============================================================ */

import React from "react";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

export function PageShell({ width = "narrow", className = "", children }) {
  return (
    <div className="gb-page">
      <div
        className={cx(
          "gb-shell",
          width === "wide" && "gb-shell--wide",
          width === "reading" && "gb-shell--reading",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PageSplit({ aside, children, mobileStack = false }) {
  return (
    <div className={cx("gb-page-split", mobileStack && "gb-page-split--stack")}>
      {aside ? <aside className="gb-page-sidebar">{aside}</aside> : null}
      <main className="gb-page-main">{children}</main>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  action,
  className = "",
}) {
  return (
    <section className={cx("gb-page-hero", className)}>
      {eyebrow ? <div className="gb-page-eyebrow">{eyebrow}</div> : null}
      <h1 className="gb-page-title">
        {title}
        {accent ? <span className="gb-page-title-accent">{accent}</span> : null}
      </h1>
      {description ? <p className="gb-page-description">{description}</p> : null}
      {action ? <div className="gb-page-hero-action">{action}</div> : null}
    </section>
  );
}

export function SectionTitle({ children, className = "" }) {
  return <div className={cx("gb-section-title", className)}>{children}</div>;
}

export function Card({
  as: Component = "div",
  className = "",
  muted = false,
  interactive = false,
  children,
  ...props
}) {
  return (
    <Component
      className={cx(
        "gb-card",
        muted && "gb-card--muted",
        interactive && "gb-card--interactive",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function PillButton({
  as: Component = "button",
  tone = "secondary",
  className = "",
  children,
  ...props
}) {
  const componentProps = { className: cx("gb-pill-button", `gb-pill-button--${tone}`, className), ...props };
  if (Component === "button" && !componentProps.type) componentProps.type = "button";
  return <Component {...componentProps}>{children}</Component>;
}

export function FilterChip({ active = false, className = "", children, ...props }) {
  return (
    <PillButton
      tone={active ? "primary" : "secondary"}
      className={cx("gb-filter-chip", className)}
      {...props}
    >
      {children}
    </PillButton>
  );
}

export function FieldLabel({ children }) {
  return <span className="gb-field-label">{children}</span>;
}

export function SelectField({ label, children, className = "", ...props }) {
  return (
    <label className={cx("gb-field", className)}>
      <FieldLabel>{label}</FieldLabel>
      <select className="gb-select" {...props}>
        {children}
      </select>
    </label>
  );
}

export function StatusMessage({ tone = "neutral", className = "", children, ...props }) {
  return (
    <div className={cx("gb-status-message", `gb-status-message--${tone}`, className)} {...props}>
      {children}
    </div>
  );
}
