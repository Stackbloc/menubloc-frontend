import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PhmsShell } from "./phmsShared.jsx";
import OwnerPhmsHealth from "../OwnerPhms.jsx";
import OwnerPhmsIncidents from "../OwnerPhmsIncidents.jsx";
import OwnerPhmsIncidentDetail from "../OwnerPhmsIncidentDetail.jsx";

export default function OwnerPhmsRouter() {
  return (
    <PhmsShell>
      <Routes>
        <Route index element={<OwnerPhmsHealth />} />
        <Route path="incidents" element={<OwnerPhmsIncidents />} />
        <Route path="incidents/:incidentId" element={<OwnerPhmsIncidentDetail />} />
        <Route path="*" element={<Navigate to="/owner/phms" replace />} />
      </Routes>
    </PhmsShell>
  );
}
