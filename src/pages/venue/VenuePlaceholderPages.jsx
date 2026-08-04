import React, { useEffect, useState } from "react";
import VenueLayout, { PageCard, SectionTitle, VENUE_COLORS } from "./VenueLayout.jsx";
import {
  getVenueAnalytics,
  getVenueBilling,
  getVenueCampaigns,
  getVenueStripeSetup,
} from "../../lib/venueApi.js";

function PlaceholderPage({ title, loader }) {
  const [message, setMessage] = useState("Loading…");

  useEffect(() => {
    loader()
      .then((data) => setMessage(data?.message || "Coming soon."))
      .catch((err) => setMessage(err.message || "Unavailable"));
  }, [loader]);

  return (
    <VenueLayout title={title}>
      <PageCard>
        <SectionTitle title={title} subtitle="Phase 1 placeholder — not implemented yet." />
        <p style={{ color: VENUE_COLORS.muted, margin: 0 }}>{message}</p>
      </PageCard>
    </VenueLayout>
  );
}

export function VenueCampaignsPage() {
  return <PlaceholderPage title="Campaigns" loader={getVenueCampaigns} />;
}

export function VenueAnalyticsPage() {
  return <PlaceholderPage title="Analytics" loader={getVenueAnalytics} />;
}

export function VenueBillingPage() {
  return <PlaceholderPage title="Billing" loader={getVenueBilling} />;
}

export function VenueStripeSetupPage() {
  return <PlaceholderPage title="Stripe Setup" loader={getVenueStripeSetup} />;
}
