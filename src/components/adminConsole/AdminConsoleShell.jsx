import React from "react";
import { NavLink } from "react-router-dom";
import { BrandLogo } from "../BrandLogo.jsx";
import { ADMIN_CONSOLE } from "./adminConsoleTokens.js";
import "./adminConsoleShell.css";

function NavItem({ item, onNavigate }) {
  const {
    to,
    label,
    icon,
    end,
    sensitive,
    onSensitiveClick,
    button,
    onClick,
  } = item;

  if (button) {
    return (
      <button
        type="button"
        className="admin-console__link"
        onClick={() => {
          onClick?.();
          onNavigate?.();
        }}
      >
        {icon ? <span className="admin-console__link-icon">{icon}</span> : null}
        <span>{label}</span>
        {sensitive ? <span className="admin-console__link-lock">🔒</span> : null}
      </button>
    );
  }

  if (sensitive && onSensitiveClick) {
    return (
      <NavLink
        to={to}
        end={Boolean(end)}
        className={({ isActive }) =>
          `admin-console__link${isActive ? " admin-console__link--active" : ""}`
        }
        onClick={(e) => {
          e.preventDefault();
          onSensitiveClick(to);
          onNavigate?.();
        }}
      >
        {icon ? <span className="admin-console__link-icon">{icon}</span> : null}
        <span>{label}</span>
        <span className="admin-console__link-lock">🔒</span>
      </NavLink>
    );
  }

  const basePath = to?.split("?")[0];

  return (
    <NavLink
      to={to}
      end={Boolean(end)}
      className={({ isActive }) => {
        if (to?.includes("?")) {
          const queryPart = to.split("?")[1] || "";
          const queryActive =
            typeof window !== "undefined" &&
            window.location.pathname === basePath &&
            window.location.search.includes(queryPart);
          return `admin-console__link${queryActive ? " admin-console__link--active" : ""}`;
        }
        let active = isActive;
        return `admin-console__link${active ? " admin-console__link--active" : ""}`;
      }}
      onClick={() => onNavigate?.()}
    >
      {icon ? <span className="admin-console__link-icon">{icon}</span> : null}
      <span>{label}</span>
    </NavLink>
  );
}

/**
 * Shared 3-column admin chrome: left nav + main + optional Knowledge Base rail.
 */
export default function AdminConsoleShell({
  homeTo,
  brandSubtitle,
  brandAriaLabel,
  sidebarExtra = null,
  sections = [],
  sidebarFooter = null,
  eyebrow = null,
  title,
  mobileSubtitle = null,
  headerActions = null,
  knowledgeOpen = false,
  onToggleKnowledge,
  knowledgePanel = null,
  mobileNavOpen = false,
  onMobileNavOpenChange,
  children,
}) {
  const closeMobile = () => onMobileNavOpenChange?.(false);

  return (
    <div
      className="admin-console"
      style={{
        "--admin-sidebar-w": `${ADMIN_CONSOLE.sidebarW}px`,
        "--admin-kb-w": `${ADMIN_CONSOLE.knowledgeW}px`,
      }}
    >
      <div
        className={`admin-console__backdrop${mobileNavOpen ? " admin-console__backdrop--visible" : ""}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        className={`admin-console__sidebar${mobileNavOpen ? " admin-console__sidebar--open" : ""}`}
      >
        <div className="admin-console__brand">
          <BrandLogo
            to={homeTo}
            height={28}
            radius={6}
            matchPageBackground={false}
            pageColor={ADMIN_CONSOLE.sidebar}
            wordmarkColor={ADMIN_CONSOLE.ink}
            ariaLabel={brandAriaLabel}
          />
          {brandSubtitle ? (
            <div className="admin-console__brand-sub">{brandSubtitle}</div>
          ) : null}
        </div>

        {sidebarExtra ? (
          <div className="admin-console__sidebar-extra">{sidebarExtra}</div>
        ) : null}

        <nav className="admin-console__nav" aria-label="Console navigation">
          {sections.map((section) => (
            <div
              key={section.id || section.label}
              className={`admin-console__section${section.accent ? " admin-console__section--accent" : ""}`}
            >
              {section.label ? (
                <div className="admin-console__section-label">{section.label}</div>
              ) : null}
              {(section.items || []).map((item) => (
                <NavItem
                  key={item.key || item.to || item.label}
                  item={item}
                  onNavigate={closeMobile}
                />
              ))}
            </div>
          ))}
        </nav>

        {sidebarFooter ? (
          <div className="admin-console__sidebar-footer">{sidebarFooter}</div>
        ) : null}
      </aside>

      <div className="admin-console__column">
        <div className="admin-console__main">
          <header className="admin-console__header">
            <div className="admin-console__header-left">
              <button
                type="button"
                className="admin-console__menu-button"
                onClick={() => onMobileNavOpenChange?.(!mobileNavOpen)}
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileNavOpen}
              >
                ☰
              </button>
              <div className="admin-console__title-wrap">
                {eyebrow ? (
                  <div className="admin-console__eyebrow">{eyebrow}</div>
                ) : null}
                <h1 className="admin-console__title">{title}</h1>
                {mobileSubtitle ? (
                  <div className="admin-console__mobile-subtitle">{mobileSubtitle}</div>
                ) : null}
              </div>
            </div>
            <div className="admin-console__header-right">
              {headerActions}
              {onToggleKnowledge ? (
                <button
                  type="button"
                  className={`admin-console__kb-toggle${knowledgeOpen ? " admin-console__kb-toggle--active" : ""}`}
                  onClick={onToggleKnowledge}
                  aria-pressed={knowledgeOpen}
                  aria-label={knowledgeOpen ? "Close Knowledge Base" : "Open Knowledge Base"}
                >
                  ✦ <span>Knowledge Base</span>
                </button>
              ) : null}
            </div>
          </header>
          <main className="admin-console__content">{children}</main>
        </div>

        <div
          className={`admin-console__kb-backdrop${knowledgeOpen ? " admin-console__kb-backdrop--visible" : ""}`}
          onClick={() => knowledgeOpen && onToggleKnowledge?.()}
          aria-hidden="true"
        />
        <aside
          className={`admin-console__kb${knowledgeOpen ? " admin-console__kb--open" : ""}`}
          aria-hidden={!knowledgeOpen}
        >
          {knowledgeOpen ? knowledgePanel : null}
        </aside>
      </div>
    </div>
  );
}
