import React from "react";
import { Link } from "react-router-dom";

const wrapperStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
  marginBottom: 18,
  color: "#64748b",
  fontSize: 13,
  fontWeight: 700,
};

const linkStyle = {
  color: "#475569",
  textDecoration: "none",
};

const currentStyle = {
  color: "#0f172a",
};

export default function Breadcrumbs({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={wrapperStyle}>
      {items.map((item, index) => {
        const key = `${item.label}-${index}`;
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={key}>
            {item.to && !isLast ? (
              <Link to={item.to} style={linkStyle}>
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} style={isLast ? currentStyle : undefined}>
                {item.label}
              </span>
            )}

            {!isLast ? <span aria-hidden="true">/</span> : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
