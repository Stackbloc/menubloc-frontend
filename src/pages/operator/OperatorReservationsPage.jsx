/**
 * /operator/reservations — the restaurant's Reservations screen (Social Dining Phase 4, BE mig 0443).
 * The switch, new requests (Accept / Decline), and Confirmed today with codes.
 */
import React, { useMemo } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import RestaurantReservationsPanel from "../../components/reservations/RestaurantReservationsPanel.jsx";

export default function OperatorReservationsPage() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id;
  const panelApi = useMemo(
    () =>
      rid
        ? {
            list: () => api.getReservations(rid),
            setEnabled: (on) => api.setReservationsEnabled(rid, on),
            accept: (id) => api.acceptReservation(rid, id),
            decline: (id) => api.declineReservation(rid, id),
            markEntered: (id, on) => api.markReservationEntered(rid, id, on),
          }
        : null,
    [rid]
  );
  return (
    <OperatorLayout title="Reservations">
      {panelApi ? (
        <RestaurantReservationsPanel
          key={rid}
          api={panelApi}
          restaurantName={selectedRestaurant?.restaurant_name || selectedRestaurant?.name || ""}
        />
      ) : (
        <div style={{ padding: 16, color: "#6b7280" }}>Pick a restaurant first.</div>
      )}
    </OperatorLayout>
  );
}
