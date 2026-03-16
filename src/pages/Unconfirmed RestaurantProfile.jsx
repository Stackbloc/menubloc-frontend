/**
 * ============================================================
 * File: UnconfirmedRestaurantProfile.jsx
 * Path: menubloc-frontend/src/pages/UnconfirmedRestaurantProfile.jsx
 * Date: 2026-03-10
 * Purpose:
 *   Fallback profile/sales page for unconfirmed restaurants that
 *   do not yet have a live Grubbid profile.
 * ============================================================
 */

import React from "react";
import { useLocation, useParams } from "react-router-dom";

function readRestaurantName(locationState, params) {
  if (locationState?.restaurantName) return locationState.restaurantName;
  if (locationState?.name) return locationState.name;
  if (params?.name) {
    return decodeURIComponent(params.name)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Restaurant";
}

function FieldRow({ label, value, lockedMessage = "" }) {
  const hasValue = Boolean(value && String(value).trim());

  return (
    <div className="border-b border-gray-200 py-3">
      <div className="text-sm font-semibold text-gray-800">{label}</div>
      <div className="mt-1 text-sm text-gray-600">
        {hasValue ? (
          value
        ) : lockedMessage ? (
          <span className="italic text-gray-500">{lockedMessage}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>
    </div>
  );
}

export default function UnconfirmedRestaurantProfile() {
  const location = useLocation();
  const params = useParams();

  const restaurant = location.state?.restaurant || {};
  const restaurantName = readRestaurantName(location.state, params);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Unconfirmed Listing
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{restaurantName}</h1>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            This restaurant does not yet have a completed Grubbid profile.
            Claiming and verifying the listing unlocks a richer public presence.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Public Profile Preview
            </h2>

            <FieldRow
              label="Restaurant Name"
              value={restaurantName}
            />

            <FieldRow
              label="Cuisine"
              value={restaurant.cuisine}
              lockedMessage="Your information appears here with a free Verified subscription."
            />

            <FieldRow
              label="Category"
              value={restaurant.category}
              lockedMessage="Your information appears here with a free Verified subscription."
            />

            <FieldRow
              label="Address"
              value={restaurant.address}
              lockedMessage="Your information appears here with a free Verified subscription."
            />

            <FieldRow
              label="Phone"
              value={restaurant.phone}
              lockedMessage="Your information appears here with a free Verified subscription."
            />

            <FieldRow
              label="Hours"
              value={restaurant.hours}
              lockedMessage="Your information appears here with a free Verified subscription."
            />

            <FieldRow
              label="Website"
              value={restaurant.website}
              lockedMessage="Your information appears here with a free Verified subscription."
            />

            <FieldRow
              label="Story / About"
              value={restaurant.about}
              lockedMessage="Your information appears here with a Pro subscription."
            />

            <FieldRow
              label="Featured Photos"
              value={restaurant.photos}
              lockedMessage="Your information appears here with a Pro subscription."
            />

            <FieldRow
              label="Special Promotions"
              value={restaurant.promotions}
              lockedMessage="Your information appears here with a Pro subscription."
            />

            <FieldRow
              label="Priority Brand Presentation"
              value={restaurant.brandPresentation}
              lockedMessage="Your information appears here with a Pro subscription."
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Claim This Listing
            </h2>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="font-semibold text-gray-900">Verified</div>
                <p className="mt-2">
                  Free verification gives your restaurant a completed public
                  profile with core business information shown to users.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="font-semibold text-gray-900">Pro</div>
                <p className="mt-2">
                  Pro unlocks enhanced brand presentation, richer profile
                  content, and stronger merchandising opportunities.
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
                onClick={() => {
                  window.location.href = "/for-restaurants";
                }}
              >
                Claim or Upgrade This Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}