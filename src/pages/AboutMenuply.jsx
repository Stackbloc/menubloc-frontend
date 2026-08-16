import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { PageHero, PageShell, SectionTitle } from "../components/grubbid/GrubbidPrimitives.jsx";
import { BrandLogo } from "../components/BrandLogo.jsx";
import BottomNav from "../components/BottomNav.jsx";

const paragraphStyle = {
  margin: "0 0 18px",
  color: "#374151",
  fontSize: "15px",
  lineHeight: 1.8,
};

const statementStyle = {
  ...paragraphStyle,
  margin: "0 0 8px",
  color: "#0B0F0C",
  fontWeight: 700,
};

export default function AboutMenuply() {
  const { t } = useLanguage();

  return (
    <>
      <PageShell width="reading">
        <div style={{ marginBottom: 16 }}>
          <BrandLogo height={36} radius={8} matchPageBackground={false} />
        </div>

        <PageHero title={t("about.title", "About Menuply")} />

        <div style={{ maxWidth: 720 }}>
          <SectionTitle style={{ marginTop: 8, marginBottom: 16 }}>
            {t("about.sectionFoodSocial", "Food is social.")}
          </SectionTitle>

          <p style={{ ...statementStyle, fontSize: "17px", marginBottom: 18 }}>
            {t(
              "about.identity",
              "Menuply helps people find, explore, share, and experience food together."
            )}
          </p>

          <p style={paragraphStyle}>
            {t(
              "about.heroDiscover",
              "Discover restaurants, menus, dishes, deals, and what people are eating around you. Compare the things that matter to you, share what you find, invite someone to eat, and use Waiter to discover what's happening around the food you care about."
            )}
          </p>

          <p style={paragraphStyle}>
            {t("about.heroBeliefPrefix", "We believe food is about more than finding a restaurant. It's about ")}
            <strong>
              {t(
                "about.heroBeliefStrong",
                "what you eat, who you eat with, and discovering something good."
              )}
            </strong>
          </p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--gb-color-border, #e5e7eb)",
              margin: "8px 0 28px",
            }}
          />

          <SectionTitle style={{ marginTop: 0, marginBottom: 16 }}>
            {t(
              "about.sectionInfoTitle",
              "Better information. More choice. No judgment."
            )}
          </SectionTitle>

          <p style={paragraphStyle}>
            {t(
              "about.infoP1",
              "Menuply brings restaurant information together so diners can make better-informed choices."
            )}
          </p>

          <p style={paragraphStyle}>
            {t(
              "about.infoP2",
              "We make menus more accessible and useful, helping people explore dishes, ingredients, prices, nutrition, dietary preferences, and other information that can matter when deciding where and what to eat."
            )}
          </p>

          <p style={paragraphStyle}>
            {t(
              "about.infoP3",
              "Whether you're looking for comfort food, trying to increase protein, reduce sodium, avoid certain ingredients, compare prices, find a deal, or simply discover somewhere new, Menuply is designed to make the decision easier."
            )}
          </p>

          <p style={{ ...statementStyle, fontSize: "17px", marginBottom: 18 }}>
            {t("about.infoDecide", "We provide information. You decide what to eat.")}
          </p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--gb-color-border, #e5e7eb)",
              margin: "8px 0 28px",
            }}
          />

          <SectionTitle style={{ marginTop: 0, marginBottom: 16 }}>
            {t("about.sectionEatingSocial", "Eating is social.")}
          </SectionTitle>

          <p style={paragraphStyle}>
            {t(
              "about.socialP1",
              "Sometimes you eat alone. Sometimes you eat with friends or family. Sometimes you want to meet someone new through food."
            )}
          </p>

          <p style={paragraphStyle}>
            {t("about.socialP2", "Menuply gives you ways to make eating more social.")}
          </p>

          <p style={paragraphStyle}>
            <strong>
              {t("about.socialConnectLead", "Connect with the people you eat with.")}
            </strong>{" "}
            {t(
              "about.socialConnectBody",
              "Share food photos and comments. See what people around you are eating. Discover food activity in places that interest you. Meet people through food. And invite someone when you find something good."
            )}
          </p>

          <p style={{ ...statementStyle, fontSize: "17px", marginBottom: 18 }}>
            {t(
              "about.socialClose",
              "Find something good. Share it. Invite someone. Eat together."
            )}
          </p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--gb-color-border, #e5e7eb)",
              margin: "8px 0 28px",
            }}
          />

          <SectionTitle style={{ marginTop: 0, marginBottom: 16 }}>
            {t("about.sectionRestaurants", "For Restaurants")}
          </SectionTitle>

          <p style={paragraphStyle}>
            {t(
              "about.restP1",
              "Restaurants deserve better tools and a better relationship with their customers."
            )}
          </p>

          <p style={paragraphStyle}>
            {t(
              "about.restP2",
              "Menuply helps restaurants maintain their menus, build their presence, communicate with diners, and become easier to discover."
            )}
          </p>

          <p style={paragraphStyle}>
            {t(
              "about.restP3",
              "We also believe restaurants and diners deserve an alternative to the high costs of traditional third-party marketplaces."
            )}
          </p>

          <p style={paragraphStyle}>
            {t(
              "about.restP4",
              "When restaurants pay substantial commissions and fees, those costs can contribute to higher menu prices. Menuply's goal is to operate at a lower cost so restaurants can keep more of what they earn and have more flexibility in how they price and serve their customers."
            )}
          </p>

          <p style={{ ...statementStyle, fontSize: "17px", marginBottom: 18 }}>
            {t(
              "about.restClose",
              "Better economics for restaurants can mean better prices and choices for diners."
            )}
          </p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--gb-color-border, #e5e7eb)",
              margin: "8px 0 28px",
            }}
          />

          <SectionTitle style={{ marginTop: 0, marginBottom: 16 }}>
            {t("about.sectionDifferent", "A Different Kind of Food Platform")}
          </SectionTitle>

          <p style={paragraphStyle}>
            {t("about.diffP1", "Menuply isn't just a place to look up restaurants.")}
          </p>

          <p style={paragraphStyle}>
            {t("about.diffP2Prefix", "It's a place to ")}
            <strong>
              {t(
                "about.diffP2Strong",
                "discover food, understand your choices, share what you're eating, connect with people, and decide where to eat next."
              )}
            </strong>
          </p>

          <p style={{ ...statementStyle, marginTop: 28 }}>
            {t("about.closer1", "Enjoy your food.")}
          </p>
          <p style={statementStyle}>{t("about.closer2", "Understand your food.")}</p>
          <p style={statementStyle}>{t("about.closerShare", "Share your food.")}</p>
          <p style={statementStyle}>{t("about.closer3", "That's Menuply.")}</p>

          <p style={{ ...paragraphStyle, marginTop: 26, fontSize: "13px", color: "#6B7280" }}>
            {t("about.dataAttributionPrefix", "Certain data provided to Menuply by ")}
            <a
              href="https://simplemaps.com/data/businesses"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#1D4ED8" }}
            >
              SimpleMaps.com
            </a>
            {t("about.dataAttributionSuffix", ".")}
          </p>
        </div>
      </PageShell>
      <BottomNav />
    </>
  );
}
