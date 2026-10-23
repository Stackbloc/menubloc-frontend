import React, { useEffect, useMemo, useState } from "react";
import { buildDraftTabs, suggestFoodDrinkTabs } from "../../lib/menuSectionLayout.js";

/**
 * Owner/operator control for section order + menu tabs inside one menu
 * (menus.section_layout). One tab = order only; 2+ tabs = diners see a tab bar
 * (e.g. Food / Drinks). Saved through api.updateMenu({ section_layout }).
 */

function move(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

export default function MenuSectionLayoutPanel({
  restaurantId,
  menu,
  sectionNames,
  api,
  colors,
  fieldStyle,
  onSaved,
}) {
  const [open, setOpen] = useState(false);
  const [tabs, setTabs] = useState(() => buildDraftTabs(menu?.section_layout, sectionNames));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const namesKey = sectionNames.join("\u0001");
  useEffect(() => {
    setTabs(buildDraftTabs(menu?.section_layout, sectionNames));
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.section_layout, namesKey]);

  const hasLayout = Array.isArray(menu?.section_layout?.tabs) && menu.section_layout.tabs.length > 0;
  const savedTabCount = hasLayout ? menu.section_layout.tabs.length : 0;
  const summary = !hasLayout
    ? "Automatic order · no tabs"
    : savedTabCount > 1
    ? `${savedTabCount} tabs: ${menu.section_layout.tabs.map((t) => t.label).join(" · ")}`
    : "Custom section order";
  const suggestion = useMemo(() => suggestFoodDrinkTabs(sectionNames), [namesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(next) {
    setTabs(next);
    setDirty(true);
    setMsg(null);
  }

  function addTab() {
    const next = tabs.map((t) => ({ ...t, sections: [...t.sections] }));
    if (next.length === 1 && !next[0].label.trim()) next[0].label = "Food";
    next.push({ label: next.length === 1 ? "Drinks" : "New tab", sections: [] });
    update(next);
  }

  function removeTab(index) {
    if (tabs.length < 2) return;
    const target = index === 0 ? 1 : index - 1;
    const next = tabs.map((t) => ({ ...t, sections: [...t.sections] }));
    next[target].sections.push(...next[index].sections);
    next.splice(index, 1);
    if (next.length === 1) next[0].label = "";
    update(next);
  }

  function moveSection(tabIndex, from, to) {
    update(tabs.map((t, i) => (i === tabIndex ? { ...t, sections: move(t.sections, from, to) } : t)));
  }

  function sendSectionToTab(fromTab, sectionIndex, toTab) {
    const next = tabs.map((t) => ({ ...t, sections: [...t.sections] }));
    const [name] = next[fromTab].sections.splice(sectionIndex, 1);
    next[toTab].sections.push(name);
    update(next);
  }

  async function save(layout) {
    setSaving(true);
    setMsg(null);
    try {
      const data = await api.updateMenu(restaurantId, menu.id, { section_layout: layout });
      setDirty(false);
      setMsg({ ok: true, text: layout ? "Saved." : "Back to automatic order." });
      onSaved?.(data?.menu);
    } catch (err) {
      setMsg({ ok: false, text: err?.payload?.error || err?.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    const multi = tabs.length > 1;
    const blank = multi && tabs.some((t) => !t.label.trim());
    if (blank) {
      setMsg({ ok: false, text: "Give every tab a name." });
      return;
    }
    save({ tabs: tabs.map((t) => ({ label: multi ? t.label.trim() : "", sections: t.sections })) });
  }

  const smallBtn = {
    padding: "4px 8px",
    borderRadius: 7,
    background: "#fff",
    border: `1px solid ${colors.line}`,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    color: colors.ink,
    lineHeight: 1.2,
  };
  const multi = tabs.length > 1;

  return (
    <div
      data-testid="menu-section-layout-panel"
      style={{ marginBottom: 18, border: `1px solid ${colors.line}`, borderRadius: 12, background: "#fff" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>
          <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: colors.ink }}>
            Menu tabs & section order
          </span>
          <span style={{ display: "block", fontSize: 12, color: colors.muted, marginTop: 2 }}>{summary}</span>
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent }}>{open ? "Close" : "Edit"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: colors.muted, lineHeight: 1.5 }}>
            Put sections in the order diners should see them. Add a tab to split the menu — for
            example <strong>Food</strong> and <strong>Drinks</strong>. New sections from later uploads
            show up at the end of the first tab.
          </p>

          {sectionNames.length === 0 ? (
            <div style={{ fontSize: 13, color: colors.muted }}>Add sections to this menu first.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button type="button" onClick={addTab} style={smallBtn} disabled={tabs.length >= 12}>
                  + Add tab
                </button>
                {suggestion && (
                  <button
                    type="button"
                    onClick={() => update(suggestion)}
                    style={smallBtn}
                    title="Sections with tea, coffee, milk, slush, smoothie, juice… go to Drinks"
                  >
                    Suggest Food / Drinks
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tabs.map((tab, tabIndex) => (
                  <div
                    key={tabIndex}
                    data-testid="menu-section-layout-tab"
                    style={{
                      border: multi ? `1px solid ${colors.line}` : "none",
                      borderRadius: 10,
                      padding: multi ? 10 : 0,
                      background: multi ? colors.panel || "#fffdf8" : "transparent",
                    }}
                  >
                    {multi && (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                        <input
                          type="text"
                          value={tab.label}
                          maxLength={40}
                          aria-label={`Tab ${tabIndex + 1} name`}
                          placeholder="Tab name (e.g. Drinks)"
                          onChange={(e) =>
                            update(tabs.map((t, i) => (i === tabIndex ? { ...t, label: e.target.value } : t)))
                          }
                          style={{ ...fieldStyle, flex: 1, fontWeight: 700, padding: "6px 10px" }}
                        />
                        <button
                          type="button"
                          aria-label="Move tab left"
                          disabled={tabIndex === 0}
                          onClick={() => update(move(tabs, tabIndex, tabIndex - 1))}
                          style={smallBtn}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          aria-label="Move tab right"
                          disabled={tabIndex === tabs.length - 1}
                          onClick={() => update(move(tabs, tabIndex, tabIndex + 1))}
                          style={smallBtn}
                        >
                          →
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTab(tabIndex)}
                          style={{ ...smallBtn, color: "#991b1b" }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {tab.sections.length === 0 ? (
                      <div style={{ fontSize: 12, color: colors.muted, padding: "6px 2px" }}>
                        No sections yet — use “Move to” on a section to put it here.
                      </div>
                    ) : (
                      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                        {tab.sections.map((name, i) => (
                          <li
                            key={name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 8px",
                              borderRadius: 8,
                              background: "#fff",
                              border: `1px solid ${colors.line}`,
                            }}
                          >
                            <span style={{ width: 22, fontSize: 11, color: colors.muted, fontWeight: 700 }}>{i + 1}</span>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.ink, minWidth: 0, overflowWrap: "anywhere" }}>
                              {name}
                            </span>
                            <button
                              type="button"
                              aria-label={`Move ${name} up`}
                              disabled={i === 0}
                              onClick={() => moveSection(tabIndex, i, i - 1)}
                              style={smallBtn}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${name} down`}
                              disabled={i === tab.sections.length - 1}
                              onClick={() => moveSection(tabIndex, i, i + 1)}
                              style={smallBtn}
                            >
                              ↓
                            </button>
                            {multi && (
                              <select
                                aria-label={`Move ${name} to tab`}
                                value=""
                                onChange={(e) => {
                                  if (e.target.value !== "") sendSectionToTab(tabIndex, i, Number(e.target.value));
                                }}
                                style={{ ...smallBtn, padding: "4px 6px" }}
                              >
                                <option value="">Move to…</option>
                                {tabs.map((t, ti) =>
                                  ti === tabIndex ? null : (
                                    <option key={ti} value={ti}>
                                      {t.label.trim() || `Tab ${ti + 1}`}
                                    </option>
                                  )
                                )}
                              </select>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 9,
                    background: dirty ? colors.accent : "#d0d5dd",
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: saving || !dirty ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving…" : "Save order & tabs"}
                </button>
                {hasLayout && (
                  <button type="button" onClick={() => save(null)} disabled={saving} style={smallBtn}>
                    Reset to automatic
                  </button>
                )}
                {msg && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: msg.ok ? "#15803d" : "#8b2e1a" }}>{msg.text}</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
