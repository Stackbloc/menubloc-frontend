// menubloc-frontend/src/pages/MenuPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import GrubbidMenuView from "../GrubbidMenuView.jsx";

export default function MenuPage() {
  const { restaurantId } = useParams();
  return <GrubbidMenuView restaurantId={restaurantId || null} />;
}