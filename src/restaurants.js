// menubloc-backend/src/restaurants.js
const express = require("express");
const router = express.Router();
const pool = require("./db");

// -------------------------
// GET /restaurants
// returns raw array (matches your current /restaurants behavior)
// -------------------------
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT *
       FROM restaurants
       ORDER BY id DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /restaurants error:", err);
    return res.status(500).json({ error: "Failed to load restaurants" });
  }
});

// -------------------------
// GET /restaurants/search?q=...
// IMPORTANT: must come BEFORE "/:id" route
// -------------------------
router.get("/search", async (req, res) => {
  try {
    const qRaw = (req.query.q || "").trim();
    if (qRaw.length < 2) return res.json([]);

    const qLower = qRaw.toLowerCase();

    const sql = `
      SELECT *
      FROM restaurants
      WHERE name ILIKE '%' || $1 || '%'
      ORDER BY
        CASE
          WHEN lower(name) = $2 THEN 0
          WHEN lower(name) LIKE $2 || '%' THEN 1
          ELSE 2
        END,
        name
      LIMIT 25
    `;

    const { rows } = await pool.query(sql, [qRaw, qLower]);
    return res.json(rows); // raw array
  } catch (err) {
    console.error("GET /restaurants/search error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
});

// -------------------------
// GET /restaurants/:id
// -------------------------
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

    const { rows } = await pool.query(
      `SELECT *
       FROM restaurants
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Not found" });

    return res.json(rows[0]); // you appear to like returning a single object
  } catch (err) {
    console.error("GET /restaurants/:id error:", err);
    return res.status(500).json({ error: "Failed to load restaurant" });
  }
});

module.exports = router;
