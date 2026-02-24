// menubloc-frontend/src/pages/EasyMenuLanding.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function EasyMenuLanding() {
  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "100px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        lineHeight: "1.7",
      }}
    >
      <div style={{ display: "flex", marginBottom: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Grubbid</div>
      </div>

      <h1>Stop Letting Your Menu Sit Invisible Online</h1>

      <p style={{ fontSize: "19px", marginTop: "25px" }}>
        Restaurant owners: your menu is your product. Why is it trapped in a PDF no one can search?
      </p>

      <p style={{ marginTop: "20px" }}>
        Upload your existing menu once. We transform it into a searchable, intelligent menu that helps customers discover
        your dishes — not just your restaurant name.
      </p>

      <div
        style={{
          marginTop: "35px",
          textAlign: "left",
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <ul style={{ fontSize: "17px" }}>
          <li>✔ Customers can search by dish, not just by restaurant</li>
          <li>✔ Dietary filters (vegan, gluten-free, etc.) increase visibility</li>
          <li>✔ No redesign. No complicated tech setup</li>
          <li>✔ Works with your existing PDF menu</li>
        </ul>
      </div>

      <p style={{ marginTop: "30px" }}>We handle the structure. You keep control.</p>

      {/* ✅ Internal route to RestaurantSignup.jsx */}
      <Link
        to="/signup"
        style={{
          display: "inline-block",
          marginTop: "40px",
          padding: "18px 36px",
          backgroundColor: "black",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        Upload My Menu Free
      </Link>

      <p style={{ marginTop: "25px", fontSize: "14px", color: "#555" }}>
        Takes less than 5 minutes. No commitment required.
      </p>
    </div>
  );
}