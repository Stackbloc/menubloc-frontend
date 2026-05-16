import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const CATEGORY_ORDER = [
  "Account & Billing",
  "Menu Management",
  "Deals & Billboard",
  "Restaurant Profile",
  "Orders & Marketplace",
  "Technical Issues",
];

const ACCOUNT_AND_BILLING_TOPICS = [
  "Subscription plans",
  "Commission basics",
  "Billing date",
  "Daily sales deposits",
  "Taxes",
];

const TICKET_CATEGORIES = [
  "Menu correction",
  "Billing / sales deposits",
  "Restaurant profile",
  "Deals / billboard",
  "Orders / marketplace",
  "Technical issue",
  "Other",
];

const QUICK_ACTIONS = [
  { title: "Fix My Menu", description: "Correct items, section placement, and menu details.", route: "/operator/menu" },
  { title: "Update Pricing", description: "Open Menu Editor and revise item prices.", route: "/operator/menu" },
  { title: "Upload a Menu", description: "Start a new PDF or image-based menu upload.", route: "/restaurant/pdf-upload" },
  { title: "Create a Billboard", description: "Use an existing deal as the basis for billboard promotion.", route: "/operator/deals" },
  { title: "Manage Deals", description: "Create, publish, or pause active promotions.", route: "/operator/deals" },
  { title: "Edit Restaurant Profile", description: "Update hours, contact details, and public profile information.", route: "/operator/profile" },
  { title: "Check Order / Marketplace Settings", description: "Review delivery and order visibility settings.", route: "/operator/delivery" },
  { title: "Request Menu Review", description: "Submit a menu review request with screenshots and item names.", prefillCategory: "Menu correction" },
  { title: "Billing & Sales Deposits", description: "Review subscription details and report deposit issues when needed.", route: "/operator/subscription" },
  { title: "Report a Technical Issue", description: "Send steps, screenshots, and the affected page to support.", prefillCategory: "Technical issue" },
];

const STATUS_STYLES = {
  open: { label: "open", bg: "#eef7ff", color: "#1d4f91" },
  in_review: { label: "in_review", bg: "#fff4dd", color: "#8a5a00" },
  waiting_on_restaurant: { label: "waiting_on_restaurant", bg: "#fff0e8", color: "#a14512" },
  resolved: { label: "resolved", bg: "#edf7f2", color: "#1f6b48" },
  closed: { label: "closed", bg: "#f2f4f7", color: "#475467" },
};

function normalizeTicketStatus(status) {
  const raw = String(status || "").trim().toLowerCase();
  if (raw === "in_progress") return "in_review";
  if (raw === "waiting") return "waiting_on_restaurant";
  if (raw in STATUS_STYLES) return raw;
  return "open";
}

function buildArticleHaystack(article) {
  return [
    article.title,
    article.category,
    article.body,
    ...(article.tags || []),
    ...(article.search_keywords || []),
  ]
    .join(" ")
    .toLowerCase();
}

export default function RestaurantHelpCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { operator, selectedRestaurant } = useOperator();
  const [articles, setArticles] = useState([]);
  const [knownIssues, setKnownIssues] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successTicketId, setSuccessTicketId] = useState("");
  const [setupSnapshot, setSetupSnapshot] = useState({
    profileStatus: "Not available",
    menuStatus: "Not available",
    billboardStatus: "Not available",
    verificationStatus: "Not available",
  });
  const [form, setForm] = useState({
    category: "Technical issue",
    subject: "",
    description: "",
    priority: "normal",
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [articlesRes, knownIssuesRes, ticketsRes] = await Promise.all([
          api.getHelpArticles(),
          api.getKnownIssues(),
          api.getTickets(),
        ]);

        if (!mounted) return;
        setArticles(articlesRes.articles || []);
        setKnownIssues(knownIssuesRes.issues || []);
        setTickets(ticketsRes.tickets || []);

        if (selectedRestaurant?.id) {
          const [profileRes, menusRes, dealsRes] = await Promise.all([
            api.getProfile(selectedRestaurant.id).catch(() => null),
            api.getMenus(selectedRestaurant.id).catch(() => null),
            api.getDeals(selectedRestaurant.id).catch(() => null),
          ]);

          if (!mounted) return;
          const deals = dealsRes?.deals || [];
          setSetupSnapshot({
            profileStatus: profileRes?.profile?.profile_status || profileRes?.profile?.listing_status || "Not available",
            menuStatus: menusRes?.menus?.length ? `${menusRes.menus.length} menu(s)` : "Not available",
            billboardStatus: deals.some((deal) => deal.billboard_status === "active") ? "Active" : "Not available",
            verificationStatus: profileRes?.profile?.claim_status || "Not available",
          });
        }
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError.message || "Unable to load the Restaurant Operations Center.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [selectedRestaurant]);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((article) => buildArticleHaystack(article).includes(q));
  }, [articles, query]);

  const groupedArticles = useMemo(() => (
    CATEGORY_ORDER.map((category) => ({
      category,
      articles: filteredArticles.filter((article) => article.category === category),
    })).filter((group) => group.articles.length > 0)
  ), [filteredArticles]);

  const possibleAnswers = useMemo(() => {
    const q = `${form.subject} ${form.description}`.trim().toLowerCase();
    if (!q) return [];

    const tokens = Array.from(new Set(q.split(/\W+/).map((token) => token.trim()).filter((token) => token.length >= 3)));
    if (!tokens.length) return [];

    return articles
      .map((article) => {
        const haystack = buildArticleHaystack(article);
        const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
        return { article, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
      .slice(0, 3)
      .map((entry) => entry.article);
  }, [articles, form.subject, form.description]);

  async function reloadTickets() {
    const ticketsRes = await api.getTickets();
    setTickets(ticketsRes.tickets || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessTicketId("");

    try {
      const response = await api.createTicket({
        subject: form.subject,
        message: form.description,
        description: form.description,
        category: form.category,
        priority: form.priority,
        restaurant_id: selectedRestaurant?.id || null,
        source_page: location.pathname,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        metadata: {
          operator_user_id: operator?.id || null,
          restaurant_id: selectedRestaurant?.id || null,
          account_email: operator?.email || null,
          current_route: `${location.pathname}${location.search || ""}`,
          browser_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        },
      });

      setSuccessTicketId(String(response.ticket?.id || ""));
      setForm((current) => ({
        ...current,
        subject: "",
        description: "",
        priority: "normal",
      }));
      await reloadTickets();
    } catch (submitError) {
      setError(submitError.message || "Unable to submit support ticket.");
    }
  }

  function handleQuickAction(action) {
    if (action.route) {
      navigate(action.route);
      return;
    }

    setForm((current) => ({
      ...current,
      category: action.prefillCategory || current.category,
    }));
    document.getElementById("support-ticket-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <OperatorLayout title="Restaurant Operations Center">
      <div style={{ display: "grid", gap: 24 }}>
        <section style={cardStyle}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f1720" }}>Restaurant Operations Center</div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#5b6675", lineHeight: 1.6 }}>
            Find answers, manage common issues, and contact Menuply support when needed.
          </div>
          <div style={{ marginTop: 10, fontSize: 14, color: "#5b6675", lineHeight: 1.6 }}>
            Menuply is designed so restaurants can manage most tasks directly. Search for an answer first, then submit a ticket if you need help.
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Menuply Help"
            style={{ ...fieldStyle, marginTop: 18, fontSize: 16, padding: "15px 16px" }}
          />
        </section>

        <section>
          <div style={sectionLabelStyle}>Quick actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {QUICK_ACTIONS.map((action) => (
              <button key={action.title} onClick={() => handleQuickAction(action)} style={actionCardStyle}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1720" }}>{action.title}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#5b6675", lineHeight: 1.5 }}>{action.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)", gap: 18, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 18 }}>
            {groupedArticles.map((group) => (
              <div key={group.category} style={cardStyle}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1720" }}>{group.category}</div>
                {group.category === "Account & Billing" ? (
                  <div style={{ marginTop: 10, fontSize: 13, color: "#5b6675" }}>
                    {ACCOUNT_AND_BILLING_TOPICS.join(" • ")}
                  </div>
                ) : null}
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {group.articles.map((article) => (
                    <div key={article.id} style={articleCardStyle}>
                      <div style={{ fontWeight: 700, color: "#0f1720" }}>{article.title}</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: "#5b6675", lineHeight: 1.6 }}>{article.body}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#8a9ab0" }}>{(article.tags || []).join(" • ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f1720" }}>Known Issues & Updates</div>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {knownIssues.map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 13,
                      lineHeight: 1.5,
                      background: issue.severity === "warning" ? "#fff5eb" : "#f6f8fb",
                      color: "#344054",
                    }}
                  >
                    {issue.title}
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f1720" }}>Restaurant Setup</div>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <SetupRow label="Profile status" value={setupSnapshot.profileStatus} />
                <SetupRow label="Menu status" value={setupSnapshot.menuStatus} />
                <SetupRow label="Billboard status" value={setupSnapshot.billboardStatus} />
                <SetupRow label="Verification status" value={setupSnapshot.verificationStatus} />
              </div>
            </div>
          </div>
        </section>

        <section id="support-ticket-form" style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1720" }}>Contact Menuply Support</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#5b6675", lineHeight: 1.6 }}>
            For best results, include screenshots and the affected menu item names.
          </div>

          {possibleAnswers.length > 0 ? (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "#f6f8fb", border: "1px solid #e4e9f0" }}>
              <div style={{ fontWeight: 700, color: "#0f1720", marginBottom: 10 }}>Possible Answers Before Submitting</div>
              <div style={{ display: "grid", gap: 8 }}>
                {possibleAnswers.map((article) => (
                  <div key={article.id} style={{ fontSize: 13, color: "#475467" }}>
                    {article.title}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {successTicketId ? (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: "#edf7f2", color: "#1f6b48" }}>
              Ticket submitted successfully. Reference: #{successTicketId}
            </div>
          ) : null}

          {error ? (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: "#fff1ef", color: "#8b2e1a" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} style={fieldStyle}>
              {TICKET_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <input
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Subject"
              style={fieldStyle}
              required
            />
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
              rows={7}
              style={{ ...fieldStyle, resize: "vertical" }}
              required
            />
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} style={fieldStyle}>
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="urgent">urgent</option>
            </select>
            <button type="submit" disabled={loading} style={submitButtonStyle}>
              Submit ticket
            </button>
          </form>
        </section>

        <section style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f1720" }}>Recent support tickets</div>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {tickets.length === 0 ? (
              <div style={{ fontSize: 13, color: "#8a9ab0" }}>
                No support tickets yet. Search the Help Center first for faster answers to common restaurant issues.
              </div>
            ) : tickets.slice(0, 6).map((ticket) => (
              <div key={ticket.id} style={recentTicketRowStyle}>
                <div>
                  <div style={{ fontWeight: 700, color: "#0f1720" }}>{ticket.subject}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#8a9ab0" }}>#{ticket.id}</div>
                </div>
                <StatusBadge status={ticket.status} />
                <div style={{ fontSize: 13, color: "#5b6675", textAlign: "right" }}>{ticket.priority}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </OperatorLayout>
  );
}

function SetupRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
      <span style={{ color: "#5b6675" }}>{label}</span>
      <span style={{ color: "#0f1720", fontWeight: 700, textAlign: "right" }}>{value || "Not available"}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = normalizeTicketStatus(status);
  const style = STATUS_STYLES[normalized] || STATUS_STYLES.open;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "lowercase",
      }}
    >
      {style.label}
    </span>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #e4e9f0",
  borderRadius: 16,
  padding: 22,
};

const articleCardStyle = {
  border: "1px solid #eef2f6",
  borderRadius: 12,
  padding: 16,
};

const actionCardStyle = {
  background: "#fff",
  border: "1px solid #e4e9f0",
  borderRadius: 14,
  padding: 18,
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
};

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid #d8dee8",
  background: "#fff",
  padding: "12px 14px",
  font: "inherit",
};

const submitButtonStyle = {
  width: "fit-content",
  border: "none",
  borderRadius: 10,
  background: "#1F4E3D",
  color: "#fff",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const recentTicketRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) auto auto",
  gap: 12,
  alignItems: "center",
  border: "1px solid #eef2f6",
  borderRadius: 12,
  padding: 14,
};

const sectionLabelStyle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#5b6675",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  marginBottom: 12,
};
