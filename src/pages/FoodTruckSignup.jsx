/**
 * ============================================================
 * File: FoodTruckSignup.jsx
 * Path: menubloc-frontend/src/pages/FoodTruckSignup.jsx
 * Date: 2026-09-07
 * Purpose:
 *   Bookmark-preserving redirect into the unified business signup
 *   path (?kind=food_truck → RestaurantSignupEntry → account form).
 *   Account create remains POST /owner/profile with category food_truck
 *   (handled by RestaurantSignup).
 * ============================================================
 */

import { Navigate } from "react-router-dom";

export default function FoodTruckSignup() {
  return <Navigate to="/restaurant/signup?kind=food_truck" replace />;
}
