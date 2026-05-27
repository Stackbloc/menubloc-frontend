/**
 * Restaurant menu verification — token link (GET session, POST answers).
 * Minimal shell: loading / invalid / expired / completed / question list.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Link, useParams } from "react-router-dom";
import { getMenuVerificationSession, postMenuVerificationAnswers } from "../lib/menuVerificationApi.js";

const shell = {
  maxWidth: "720px",
  margin: "48px auto",
  padding: "0 16px",
  fontFamily: "system-ui, sans-serif",
};

function ChoiceOptions({ question, value, onChange, disabled }) {
  const choices = Array.isArray(question.options?.choices) ? question.options.choices : [];
  if (!choices.length) return null;
  return (
    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {choices.map((c) => {
        const id = String(c.id ?? c.value ?? "");
        return (
          <label
            key={id}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
              cursor: disabled ? "default" : "pointer",
              opacity: disabled ? 0.7 : 1,
            }}
          >
            <input
              type="radio"
              name={`q-${question.id}`}
              checked={value === id}
              disabled={disabled}
              onChange={() => onChange(id)}
            />
            <span>{c.label || id}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function MenuVerificationPage() {
  const { t } = useLanguage();
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [draft, setDraft] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [saveNotice, setSaveNotice] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("This link is missing a verification token.");
      setErrorStatus(404);
      return;
    }
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    const { ok, status, data } = await getMenuVerificationSession(token);
    setLoading(false);
    if (status === 410) {
      setError(data?.error || "This verification link has expired.");
      setErrorStatus(410);
      return;
    }
    if (!ok || !data?.ok) {
      setError(data?.error || "This verification link is not valid.");
      setErrorStatus(status || 404);
      return;
    }
    setSession(data.session);
    setQuestions(Array.isArray(data.questions) ? data.questions : []);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const setChoice = (qid, choiceId) => {
    setDraft((d) => ({ ...d, [qid]: { ...(d[qid] || {}), choice: choiceId, skipped: false } }));
  };

  const setDetail = (qid, text) => {
    setDraft((d) => ({ ...d, [qid]: { ...(d[qid] || {}), detail: text } }));
  };

  const setSkipped = (qid, skipped) => {
    setDraft((d) => ({
      ...d,
      [qid]: skipped ? { skipped: true } : { skipped: false, choice: d[qid]?.choice, detail: d[qid]?.detail },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !questions.length) return;
    setSubmitting(true);
    setSubmitError(null);
    const answers = questions.map((q) => {
      const st = draft[q.id] || {};
      if (st.skipped) return { question_id: q.id, skipped: true };
      const choice = st.choice;
      const detail = st.detail;
      if (choice != null && detail != null && String(detail).trim() !== "") {
        return { question_id: q.id, answer: { choice, detail: String(detail).trim() } };
      }
      if (choice != null) return { question_id: q.id, answer: { choice } };
      if (detail != null && String(detail).trim() !== "") return { question_id: q.id, answer: { value: String(detail).trim() } };
      return { question_id: q.id, skipped: true };
    });

    const { ok, status, data } = await postMenuVerificationAnswers(token, { answers });
    setSubmitting(false);
    if (status === 410) {
      setSubmitError(data?.error || "This link has expired.");
      return;
    }
    if (status === 409) {
      setSubmitError(data?.error || "This session is already completed.");
      await load();
      return;
    }
    if (!ok || !data?.ok) {
      setSubmitError(data?.error || "Could not save answers. Please try again.");
      return;
    }
    setSaveNotice("Saved.");
    setDraft({});
    await load();
  };

  if (loading) {
    return (
      <div style={shell}>
        <h1 style={{ fontSize: "1.5rem" }}>Loading verification…</h1>
        <p style={{ opacity: 0.8 }}>One moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={shell}>
        <h1 style={{ fontSize: "1.5rem" }}>{errorStatus === 410 ? "Link expired" : "Link not available"}</h1>
        <p style={{ marginTop: "12px" }}>{error}</p>
        <p style={{ marginTop: "24px" }}>
          <Link to="/" style={{ color: "#2563eb" }}>
            Return home
          </Link>
        </p>
      </div>
    );
  }

  if (session?.status === "completed") {
    return (
      <div style={shell}>
        <h1 style={{ fontSize: "1.5rem" }}>Thank you</h1>
        <p style={{ marginTop: "12px" }}>
          {questions.length === 0
            ? "There were no open questions, or you have finished this verification."
            : "Your responses were saved."}
        </p>
        {submitError ? <p style={{ marginTop: "12px", color: "#b45309" }}>{submitError}</p> : null}
        <p style={{ marginTop: "24px" }}>
          <Link to="/" style={{ color: "#2563eb" }}>
            Return home
          </Link>
        </p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={shell}>
        <h1 style={{ fontSize: "1.5rem" }}>Nothing to verify</h1>
        <p style={{ marginTop: "12px" }}>There are no open questions for this link.</p>
        <p style={{ marginTop: "24px" }}>
          <Link to="/" style={{ color: "#2563eb" }}>
            Return home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div style={shell}>
      <h1 style={{ fontSize: "1.5rem" }}>Confirm a few menu details</h1>
      <p style={{ marginTop: "8px", opacity: 0.85, fontSize: "0.95rem" }}>
        Please answer or skip each question. Your answers are stored for review and are not applied automatically.
      </p>
      {saveNotice ? (
        <p style={{ marginTop: "12px", color: "#065f46" }} role="status">
          {saveNotice}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} style={{ marginTop: "28px" }}>
        {questions.map((q) => {
          const st = draft[q.id] || {};
          const skipped = Boolean(st.skipped);
          const hasChoices = Array.isArray(q.options?.choices) && q.options.choices.length > 0;
          const showDetail =
            !skipped &&
            (q.options?.value_type === "money_or_skip" ||
              q.options?.value_type === "money" ||
              st.choice === "fixed" ||
              st.choice === "no");

          return (
            <div
              key={q.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>{q.prompt}</p>
              {hasChoices ? (
                <ChoiceOptions
                  question={q}
                  value={st.choice != null ? String(st.choice) : ""}
                  disabled={skipped || submitting}
                  onChange={(id) => setChoice(q.id, id)}
                />
              ) : null}
              {showDetail ? (
                <div style={{ marginTop: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "4px" }}>
                    {q.options?.value_type === "money" || q.options?.value_type === "money_or_skip"
                      ? "Price or note (optional)"
                      : "Details (optional)"}
                  </label>
                  <input
                    type="text"
                    disabled={skipped || submitting}
                    value={st.detail || ""}
                    onChange={(ev) => setDetail(q.id, ev.target.value)}
                    style={{ width: "100%", maxWidth: "420px", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </div>
              ) : null}
              <label style={{ display: "inline-flex", gap: "8px", marginTop: "12px", fontSize: "0.9rem" }}>
                <input
                  type="checkbox"
                  checked={skipped}
                  disabled={submitting}
                  onChange={(ev) => setSkipped(q.id, ev.target.checked)}
                />
                Skip this question
              </label>
            </div>
          );
        })}

        {submitError ? (
          <p role="alert" style={{ color: "#b91c1c", marginBottom: "12px" }}>
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !questions.length}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 600,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : "Submit answers"}
        </button>
      </form>
    </div>
  );
}
