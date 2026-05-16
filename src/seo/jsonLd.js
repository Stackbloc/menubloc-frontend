const SITE_BASE = "https://menuply.com";

// Crawl-efficiency safeguard — does not restrict what the UI renders.
const MAX_MENU_SECTIONS = 12;

// Crawl-efficiency safeguard — does not restrict what the UI renders.
const MAX_ITEMS_PER_SECTION = 25;

// Descriptions beyond this length are omitted from emitted JSON-LD only.
const MAX_DESCRIPTION_LENGTH = 300;

/**
 * Produce a deterministic URL-safe identifier fragment.
 * Used for stable @id values — no random IDs, no timestamps.
 */
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Sanitize a text value before emitting it in JSON-LD.
 * Does NOT mutate stored values — cleans emitted output only.
 *
 * Removes:
 *   - control characters (U+0000-U+001F except tab)
 *   - Unicode replacement character U+FFFD (common OCR extraction artifact)
 *   - repeated whitespace collapsed to single space
 *
 * Returns null when the result is empty or exceeds MAX_DESCRIPTION_LENGTH.
 */
function sanitizeText(str) {
  if (typeof str !== "string") return null;
  const cleaned = str
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length > MAX_DESCRIPTION_LENGTH) return null;
  return cleaned;
}

function buildPostalAddress(d) {
  const streetAddress = d.address_line1 || d.address;
  const addressLocality = d.city;
  const addressRegion = d.state || d.region;
  const postalCode = d.zip || d.postal_code || d.postcode;

  if (!streetAddress && !addressLocality) return null;

  const addr = { "@type": "PostalAddress", addressCountry: "US" };
  if (streetAddress) addr.streetAddress = streetAddress;
  if (addressLocality) addr.addressLocality = addressLocality;
  if (addressRegion) addr.addressRegion = addressRegion;
  if (postalCode) addr.postalCode = postalCode;
  return addr;
}

function buildGeo(d) {
  const lat = d.lat ?? d.latitude;
  const lng = d.lng ?? d.longitude;
  if (lat == null || lng == null) return null;
  return { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
}

/**
 * Build a Restaurant schema.org entity for the restaurant profile page.
 * Emits exactly one Restaurant node with a stable @id.
 * The @id format matches buildMenuPageSchema so Google can resolve them
 * as the same entity across both page types.
 */
export function buildRestaurantSchema(data) {
  if (!data) return null;

  const name = data.name || data.restaurant_name;
  if (!name) return null;

  const slugOrId = data.slug || data.id || data.restaurant_id;
  const restaurantUrl = `${SITE_BASE}/restaurants/${slugOrId}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${restaurantUrl}#restaurant`,
    name,
    url: restaurantUrl,
  };

  const address = buildPostalAddress(data);
  if (address) schema.address = address;

  const geo = buildGeo(data);
  if (geo) schema.geo = geo;

  const telephone = data.phone || data.phone_number;
  if (telephone) schema.telephone = telephone;

  const logoUrl = data.logo_url || data.logo;
  if (logoUrl) schema.image = logoUrl;

  const cuisine = data.cuisine;
  if (cuisine) schema.servesCuisine = cuisine;

  const description = sanitizeText(data.bio || data.description || data.about);
  if (description) schema.description = description;

  return schema;
}

/**
 * Build a @graph schema for the public menu page.
 * Contains exactly one Restaurant node linked to one Menu node.
 * The Restaurant @id matches buildRestaurantSchema so Google resolves both
 * page types as the same establishment — no duplicate entity declarations.
 */
export function buildMenuPageSchema(restaurantData, sections) {
  if (!restaurantData) return null;

  const name = restaurantData.name || restaurantData.restaurant_name;
  if (!name) return null;

  // Apply section cap before filtering to preserve the highest-ranked sections.
  // Crawl-efficiency safeguard — does not restrict what the UI renders.
  const cappedSections = Array.isArray(sections)
    ? sections.slice(0, MAX_MENU_SECTIONS)
    : [];

  const validSections = cappedSections.filter(
    (s) => s?.title && Array.isArray(s.items) && s.items.length > 0
  );

  if (validSections.length === 0) return null;

  const slugOrId = restaurantData.slug || restaurantData.restaurant_id || restaurantData.id;
  const restaurantUrl = `${SITE_BASE}/restaurants/${slugOrId}`;
  const menuUrl = `${restaurantUrl}/menu`;

  // One Restaurant node only — @id matches buildRestaurantSchema for entity consistency.
  const restaurantNode = {
    "@type": "Restaurant",
    "@id": `${restaurantUrl}#restaurant`,
    name,
    url: restaurantUrl,
    hasMenu: { "@id": `${menuUrl}#menu` },
  };

  const address = buildPostalAddress(restaurantData);
  if (address) restaurantNode.address = address;

  const telephone = restaurantData.phone || restaurantData.phone_number;
  if (telephone) restaurantNode.telephone = telephone;

  const logoUrl = restaurantData.logo_url || restaurantData.logo;
  if (logoUrl) restaurantNode.image = logoUrl;

  const cuisine = restaurantData.cuisine;
  if (cuisine) restaurantNode.servesCuisine = cuisine;

  const menuSections = validSections.map((section) => {
    const sectionId = `${menuUrl}#section-${slugify(section.title)}`;

    // Deduplicate items by normalized name before applying the per-section cap.
    // Crawl-efficiency safeguard — does not restrict what the UI renders.
    const seenNames = new Set();
    const uniqueItems = section.items.filter((item) => {
      if (!item?.name) return false;
      const key = item.name.trim().toLowerCase();
      if (seenNames.has(key)) return false;
      seenNames.add(key);
      return true;
    });

    // Per-section item cap applied after deduplication.
    // Crawl-efficiency safeguard — does not restrict what the UI renders.
    const cappedItems = uniqueItems.slice(0, MAX_ITEMS_PER_SECTION);

    const menuItems = cappedItems.map((item) => {
      const itemFragment = item.id
        ? `item-${item.id}`
        : `item-${slugify(item.name)}`;

      const menuItem = {
        "@type": "MenuItem",
        "@id": `${menuUrl}#${itemFragment}`,
        name: item.name,
      };

      const description = sanitizeText(item.description || item.notes);
      if (description) menuItem.description = description;

      const priceCents = item.price_cents;
      if (priceCents > 0) {
        menuItem.offers = {
          "@type": "Offer",
          price: (priceCents / 100).toFixed(2),
          priceCurrency: "USD",
        };
      }

      const diet = [];
      if (item.is_vegan) diet.push("https://schema.org/VeganDiet");
      if (item.is_gluten_free) diet.push("https://schema.org/GlutenFreeDiet");
      if (diet.length > 0) menuItem.suitableForDiet = diet;

      return menuItem;
    });

    return {
      "@type": "MenuSection",
      "@id": sectionId,
      name: section.title,
      hasMenuItem: menuItems,
    };
  });

  const menuNode = {
    "@type": "Menu",
    "@id": `${menuUrl}#menu`,
    name: `${name} Menu`,
    hasMenuSection: menuSections,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [restaurantNode, menuNode],
  };
}
