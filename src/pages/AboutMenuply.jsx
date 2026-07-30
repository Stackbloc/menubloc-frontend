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

const listStyle = {
  margin: "0 0 18px",
  paddingLeft: 22,
  color: "#374151",
  fontSize: "15px",
  lineHeight: 1.8,
};

const listItemStyle = {
  marginBottom: 8,
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
          {t("about.section1Title", "Food Intelligence for Everyone")}
        </SectionTitle>

        <p style={{ ...statementStyle, fontSize: "17px", marginBottom: 18 }}>
          {t(
            "about.lead",
            "Food intelligence built to make restaurant choices more discoverable, not more judgmental."
          )}
        </p>

        <p style={paragraphStyle}>
          {t("about.p1", "Menuply is building a different kind of restaurant platform.")}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p2",
            "The idea behind the name is simple: menus become more valuable when they work together instead of existing in isolation. By connecting restaurant menus into a single intelligent network, our vision is to give diners access to thousands of dining options through one connected experience."
          )}
        </p>

        <p style={paragraphStyle}>
          {t("about.missionIntro", "Our mission is straightforward:")}
        </p>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            {t("about.mission1", "Make restaurant menus more accessible and accurate.")}
          </li>
          <li style={listItemStyle}>
            {t(
              "about.mission2",
              "Help reduce menu price inflation by reducing restaurant marketing costs."
            )}
          </li>
          <li style={listItemStyle}>
            {t(
              "about.mission3",
              "Help restaurants build and maintain direct relationships with their customers."
            )}
          </li>
        </ul>

        <p style={paragraphStyle}>
          {t(
            "about.p3",
            "When diners visit Menuply, they aren't just searching for restaurants. We aspire to build the most comprehensive collection of restaurant menus, allowing diners to compare dishes, ingredients, prices, nutrition, dietary preferences, and other food intelligence across practically all restaurants in a given market."
          )}
        </p>

        <p style={paragraphStyle}>
          {t("about.p4", "We believe better information leads to better decisions.")}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p5",
            "Even though we provide nutrition information about menu choices, Menuply doesn't tell people what they should eat. It gives them the information to decide for themselves."
          )}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p6",
            "Whether you're looking for comfort food, trying to increase protein, reduce sodium, avoid certain ingredients, compare menu prices, or simply discover somewhere new to eat, Menuply is designed to make restaurant decisions easier, faster, and more transparent."
          )}
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--gb-color-border, #e5e7eb)", margin: "8px 0 28px" }} />

        <SectionTitle style={{ marginTop: 0, marginBottom: 16 }}>
          {t("about.section2Title", "Building a Fairer Restaurant Economy")}
        </SectionTitle>

        <p style={paragraphStyle}>
          {t(
            "about.p7",
            "Restaurants benefit as well. Menuply gives them the tools to manage accurate menus, build engaging profiles, communicate directly with diners, and participate in a growing food intelligence network that helps customers discover them."
          )}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p8",
            "We also believe the restaurant industry and diners deserve a lower-cost alternative."
          )}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p9",
            "As third-party marketplace fees have increased, many restaurants have little choice but to raise menu prices to protect already thin margins. Those higher costs are ultimately passed on to diners."
          )}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p10",
            "Menuply was built with a different philosophy. By keeping our costs lower than traditional marketplaces, we give restaurants the opportunity to offer lower prices on Menuply while still keeping more of what they earn. Everyone benefits: restaurants retain more revenue, diners pay less, and local restaurants become more competitive."
          )}
        </p>

        <p style={{ ...statementStyle, fontSize: "17px", marginTop: 8, marginBottom: 18 }}>
          {t("about.cta", "Is your restaurant bold enough to join the movement?")}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p11",
            "We're looking for restaurants that believe there is a better way."
          )}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p12",
            "Restaurants that have the courage to help create an alternative to the exorbitant platform fees causing unsustainable menu price inflation."
          )}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p13",
            "Restaurants that are willing to help reshape the future of restaurant technology."
          )}
        </p>

        <p style={paragraphStyle}>
          {t(
            "about.p14",
            "We believe the future of restaurant technology isn't just online ordering. It's making restaurants more independent so they have better control over their menus, pricing, and customer relationships."
          )}
        </p>

        <p style={{ ...statementStyle, marginTop: 28 }}>{t("about.closer1", "Enjoy your food.")}</p>
        <p style={statementStyle}>{t("about.closer2", "Understand your food.")}</p>
        <p style={statementStyle}>{t("about.closer3", "That's Menuply.")}</p>

        <p style={{ ...statementStyle, marginTop: 18, marginBottom: 0, fontSize: "17px" }}>
          {t("about.tagline", "One Menu. Multiplied by Thousands.")}
        </p>

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
