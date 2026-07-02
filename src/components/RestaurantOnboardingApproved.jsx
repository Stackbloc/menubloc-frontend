/*
File: RestaurantOnboardingApproved.jsx
Purpose: Cursor-friendly React component version of the approved Menuply restaurant onboarding screen.
*/

import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { FAQ_DEFS, FaqAnswerBlocks } from "./RestaurantFAQ.jsx";
import { BrandLogo } from "./BrandLogo.jsx";

export default function RestaurantOnboardingApproved({ onContinue }) {
  const { t } = useLanguage();
  const [agreed, setAgreed] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(-1);

  const handleContinue = () => {
    if (!agreed) return;
    if (typeof onContinue === "function") {
      onContinue();
    }
  };

  const toggleFaq = () => {
    setFaqOpen((open) => {
      if (open) setExpandedFaqIndex(-1);
      return !open;
    });
  };

  return (
    <div className="restaurant-onboarding-page">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .restaurant-onboarding-page {
          min-height: 100vh;
          background-color: #ffffff;
          color: #0B0F0C;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          font-size: 17px;
          line-height: 1.65;
          -webkit-font-smoothing: antialiased;
        }

        .restaurant-onboarding-page .page {
          max-width: 640px;
          margin: 0 auto;
          padding: 28px 24px calc(var(--bottom-nav-h, 72px) + 8px);
        }

        .restaurant-onboarding-page .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .restaurant-onboarding-page .section-label {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6B7280;
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px;
          padding: 3px 10px;
          margin-bottom: 20px;
        }

        .restaurant-onboarding-page h1 {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(28px, 6vw, 42px);
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.35px;
          color: #0B0F0C;
          margin-bottom: 18px;
        }

        .restaurant-onboarding-page .headline-emphasis {
          color: #35B96B;
          font-style: italic;
          font-weight: 400;
        }

        .restaurant-onboarding-page .body-text {
          color: #374151;
          margin-bottom: 18px;
        }

        .restaurant-onboarding-page .hero-subhead {
          font-size: 18px;
          line-height: 1.45;
          color: #374151;
          margin-bottom: 28px;
          font-weight: 500;
          font-style: italic;
        }

        .restaurant-onboarding-page .goal-section {
          margin-bottom: 28px;
        }

        .restaurant-onboarding-page .goal-section p {
          color: #374151;
          margin-bottom: 14px;
        }

        .restaurant-onboarding-page .goal-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .restaurant-onboarding-page .goal-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #374151;
        }

        .restaurant-onboarding-page .goal-list li::before {
          content: "";
          flex-shrink: 0;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4caf50;
          margin-top: 8px;
        }

        .restaurant-onboarding-page .callout {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 22px 24px;
          color: #374151;
          margin-bottom: 24px;
        }

        .restaurant-onboarding-page .info-card {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 22px 24px;
          margin-bottom: 24px;
          position: relative;
        }

        .restaurant-onboarding-page .info-card .badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4caf50;
          background: rgba(76,175,80,0.12);
          border: 1px solid rgba(76,175,80,0.3);
          border-radius: 4px;
          padding: 3px 9px;
          margin-bottom: 12px;
        }

        .restaurant-onboarding-page .info-card h2 {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: #0B0F0C;
          margin-bottom: 10px;
          padding-right: 48px;
        }

        .restaurant-onboarding-page .info-card p {
          color: #6B7280;
          margin-bottom: 14px;
        }

        .restaurant-onboarding-page .info-card .view-link {
          color: #4caf50;
          font-weight: 600;
          text-decoration: none;
          font-size: 15px;
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
        }

        .restaurant-onboarding-page .expand-btn {
          position: absolute;
          top: 22px;
          right: 22px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #4caf50;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
          line-height: 1;
        }

        .restaurant-onboarding-page .faq-list {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .restaurant-onboarding-page .faq-item {
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          overflow: hidden;
          background: transparent;
        }

        .restaurant-onboarding-page .faq-item-btn {
          width: 100%;
          border: none;
          background: transparent;
          padding: 14px 16px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          color: #0B0F0C;
          font-family: inherit;
        }

        .restaurant-onboarding-page .faq-question {
          font-size: 15px;
          line-height: 1.5;
          font-weight: 700;
          margin: 0;
        }

        .restaurant-onboarding-page .faq-item-toggle {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(76,175,80,0.3);
          background: rgba(76,175,80,0.15);
          color: #4caf50;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }

        .restaurant-onboarding-page .faq-answer {
          padding: 0 16px 16px;
          display: grid;
          gap: 10px;
        }

        .restaurant-onboarding-page .faq-answer p {
          margin: 0;
          font-size: 14px;
          line-height: 1.65;
          color: #6B7280;
        }

        .restaurant-onboarding-page .faq-answer ul {
          margin: 0 0 0 18px;
          padding: 0;
          display: grid;
          gap: 3px;
        }

        .restaurant-onboarding-page .faq-answer li {
          font-size: 14px;
          line-height: 1.65;
          color: #6B7280;
        }

        .restaurant-onboarding-page hr {
          border: none;
          border-top: 1px solid #E5E7EB;
          margin: 0 0 24px;
        }

        .restaurant-onboarding-page .agreement {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 20px;
          cursor: pointer;
          user-select: none;
        }

        .restaurant-onboarding-page .agreement input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border: 2px solid #D1D5DB;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          margin-top: 1px;
        }

        .restaurant-onboarding-page .agreement input[type="checkbox"]:checked {
          background: #4caf50;
          border-color: #4caf50;
        }

        .restaurant-onboarding-page .agreement span {
          color: #374151;
          font-size: 15px;
          cursor: pointer;
        }

        .restaurant-onboarding-page .btn-continue {
          display: block;
          width: 100%;
          padding: 17px;
          background: #F3F4F6;
          color: #9CA3AF;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: not-allowed;
          letter-spacing: 0.01em;
          font-family: inherit;
        }

        .restaurant-onboarding-page .btn-continue.active {
          background: #4caf50;
          color: #fff;
          cursor: pointer;
        }
      `}</style>

      <main className="page">
        <div className="logo">
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        </div>

        <div className="section-label">For Restaurants</div>

        <div style={{ marginBottom: 16 }}>
          <Link to="/franchises" style={{ color: "#4caf50", fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
            Franchise / Multi-location?
          </Link>
        </div>

        <h1>
          The future of the restaurant industry will not be built on{" "}
          <em className="headline-emphasis">higher prices alone.</em>
        </h1>

        <p className="hero-subhead">
          The future will be built by restaurants that create more value for diners. Menuply was built to support that future.
        </p>

        <p className="body-text">
          Traditional delivery platforms have pushed restaurants to raise prices simply to cover platform fees. Menuply is built differently.
        </p>

        <p className="body-text">
          Menuply allows restaurants to onboard using their own equipment and Menuply&apos;s online self-help resources, reducing operational infrastructure costs. This lower-cost model empowers restaurants to offer better prices and greater value to diners.
        </p>

        <p className="body-text">
          While restaurants always control their own pricing, Menuply is designed for restaurant partners who share the platform&apos;s commitment to delivering better value to diners.
        </p>

        <div className="goal-section">
          <p>Our goal is simple:</p>
          <ul className="goal-list">
            <li>Help restaurants better serve their patrons and build long-term success.</li>
            <li>Help diners better navigate their dining options and experience increased value.</li>
          </ul>
        </div>

        <div className="callout">
          “Menuply partners with restaurants committed to delivering exceptional value and keeping menu prices as affordable as practical. Restaurants that demonstrate this commitment may receive enhanced visibility and promotional opportunities throughout the platform.”
        </div>

        <div className="info-card">
          <button
            type="button"
            className="expand-btn"
            aria-label={faqOpen ? "Collapse FAQ" : "Expand FAQ"}
            aria-expanded={faqOpen}
            onClick={toggleFaq}
          >
            {faqOpen ? "−" : "+"}
          </button>
          <div className="badge">Restaurant FAQ</div>
          <h2>Questions about Menuply?</h2>
          <p>Practical answers about cost, growth expectations, and fit before moving deeper into onboarding.</p>
          <button type="button" className="view-link" onClick={toggleFaq}>
            {faqOpen ? t("onboarding.faq.hide", "Hide FAQ") : t("onboarding.faq.view", "View FAQ")}
          </button>

          {faqOpen ? (
            <div className="faq-list">
              {FAQ_DEFS.map((item, index) => {
                const expanded = expandedFaqIndex === index;
                const panelId = `restaurant-onboarding-faq-panel-${index}`;
                return (
                  <article key={item.questionKey} className="faq-item">
                    <button
                      type="button"
                      className="faq-item-btn"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setExpandedFaqIndex(expanded ? -1 : index)}
                    >
                      <p className="faq-question">{t(item.questionKey)}</p>
                      <span aria-hidden="true" className="faq-item-toggle">
                        {expanded ? "−" : "+"}
                      </span>
                    </button>
                    {expanded ? (
                      <div id={panelId} className="faq-answer">
                        <FaqAnswerBlocks
                          blocks={item.answerBlocks}
                          t={t}
                          styles={{
                            answerParagraph: undefined,
                            answerListLabel: { fontWeight: 600 },
                            answerList: undefined,
                            answerListItem: undefined,
                          }}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>

        <hr />

        <label className="agreement">
          <input
            id="agree"
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          <span>I understand and agree with Menuply&apos;s core value philosophy.</span>
        </label>

        <button
          type="button"
          className={`btn-continue${agreed ? " active" : ""}`}
          disabled={!agreed}
          onClick={handleContinue}
        >
          Continue
        </button>

      </main>
    </div>
  );
}
