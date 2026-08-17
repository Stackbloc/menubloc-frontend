import React from "react";
import ChipRail from "../../../components/chips/ChipRail.jsx";
import { ACCOUNT_TABS } from "./accountDashboardOptions.js";
import { accountStyles as styles } from "./accountDashboardStyles.js";

export default function AccountTabNav({ activeTab, onChange }) {
  return (
    <div style={styles.tabBar} className="gb-sticky-below-sph">
      <ChipRail style={styles.tabRail} role="tablist" aria-label="Account sections">
        {ACCOUNT_TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              style={{ ...styles.tabBtn, ...(active ? styles.tabBtnActive : null) }}
            >
              {tab.label}
            </button>
          );
        })}
      </ChipRail>
    </div>
  );
}
