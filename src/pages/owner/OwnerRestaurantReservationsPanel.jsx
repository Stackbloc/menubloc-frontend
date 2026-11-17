/**
 * Restaurant Manager → Reservations (Social Dining Phase 4, BE mig 0443). The same screen the
 * restaurant sees at /operator/reservations, so Andre can switch a test restaurant on and answer
 * requests for places that haven't claimed their profile.
 */
import React, { useMemo } from "react";
import { PageCard, SectionTitle } from "./OwnerLayout.jsx";
import {
  acceptOwnerReservation,
  declineOwnerReservation,
  listOwnerReservations,
  markOwnerReservationEntered,
  setOwnerReservationsEnabled,
} from "../../lib/ownerApi.js";
import RestaurantReservationsPanel from "../../components/reservations/RestaurantReservationsPanel.jsx";

export default function OwnerRestaurantReservationsPanel({ restaurantId, restaurantName = "" }) {
  const api = useMemo(
    () => ({
      list: () => listOwnerReservations(restaurantId),
      setEnabled: (on) => setOwnerReservationsEnabled(restaurantId, on),
      accept: (id) => acceptOwnerReservation(restaurantId, id),
      decline: (id) => declineOwnerReservation(restaurantId, id),
      markEntered: (id, on) => markOwnerReservationEntered(restaurantId, id, on),
    }),
    [restaurantId]
  );
  return (
    <PageCard>
      <SectionTitle title="Reservations" subtitle="Table requests from diners' plans. Accept gives the group a code." />
      <RestaurantReservationsPanel api={api} restaurantName={restaurantName} />
    </PageCard>
  );
}
