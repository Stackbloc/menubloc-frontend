/**
 * /activity now lives on Waiter (What's happening). Keep the route for footer/drawer links.
 */

import { Navigate } from "react-router-dom";

export default function ActivityPage() {
  return <Navigate to="/waiter#activity" replace />;
}
