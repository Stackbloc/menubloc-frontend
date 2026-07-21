import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";
import StripeElementsProvider from "../../components/payments/StripeElementsProvider.jsx";
import PlatformPaymentForm from "../../components/payments/PlatformPaymentForm.jsx";
import { formatMoney, hasStripePublishableKey } from "../../components/payments/paymentHelpers.js";

const FALLBACK_CREATIVE_SERVICES = [
  {
    id: "photography",
    name: "Photography",
    short_description: "Professional food and restaurant photography.",
    status: "coming_soon",
  },
  {
    id: "menuply_menu_design",
    name: "Menuply Menu Design",
    short_description: "Fixed-price Menuply menu redesign by approved providers.",
    status: "available",
    category: "menuply_menu_design",
  },
  {
    id: "social-media-graphics",
    name: "Social Media Graphics",
    short_description: "Social graphics for promotions and specials.",
    status: "coming_soon",
  },
];

const FALLBACK_CATEGORIES = [
  { id: "qr_products", label: "QR Products" },
  { id: "menus", label: "Menus" },
  { id: "signs_displays", label: "Signs & Displays" },
  { id: "marketing_materials", label: "Marketing Materials" },
];

function inputStyle() {
  return {
    width: "100%",
    border: "1px solid #d0d5dd",
    borderRadius: 12,
    padding: "12px 13px",
    fontSize: 14,
    color: "#101828",
    background: "#fff",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
}

function labelStyle() {
  return {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "#344054",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
}

function InfoTile({ label, value }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #d1fadf", borderRadius: 18, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "#101828" }}>{value}</div>
    </div>
  );
}

function productPriceLabel(product) {
  if (product.coming_soon || product.availability === "coming_soon") return "Coming Soon";
  if (product.pricing_mode === "volume_tiers") {
    if (product.display_from_total_cents != null && product.display_from_quantity != null) {
      return `From ${formatMoney(product.display_from_total_cents)}, qty ${product.display_from_quantity}`;
    }
    return "Volume pricing — select quantity";
  }
  if (product.unit_amount_cents == null) return "Coming Soon";
  return `${formatMoney(product.unit_amount_cents)} each`;
}

function ProductCard({ product, active, onSelect }) {
  const comingSoon = product.coming_soon || product.availability === "coming_soon";
  return (
    <button
      type="button"
      data-testid={`marketplace-product-${product.slug || product.sku}`}
      onClick={() => onSelect(product)}
      style={{
        textAlign: "left",
        borderRadius: 18,
        border: active ? "2px solid #1f4e3d" : "1px solid #d0d5dd",
        background: active ? "#f3faf6" : "#fff",
        padding: 16,
        cursor: "pointer",
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          height: 120,
          borderRadius: 14,
          background: "#f2f4f7",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.public_name || product.name}
            style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }}
          />
        ) : (
          <span style={{ color: "#98a2b3", fontWeight: 700 }}>Menuply</span>
        )}
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, color: "#101828" }}>
        {product.public_name || product.name}
      </div>
      <div style={{ color: "#667085", fontSize: 14, lineHeight: 1.45 }}>
        {product.short_description || product.description}
      </div>
      <div style={{ fontWeight: 800, color: comingSoon ? "#b54708" : "#1f4e3d" }}>
        {productPriceLabel(product)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1f4e3d" }}>
        {comingSoon ? "Coming Soon" : "View Product"}
      </div>
    </button>
  );
}

export default function OperatorQrKitOrder() {
  const { t } = useLanguage();
  const { selectedRestaurant } = useOperator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [creativeServices, setCreativeServices] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [orders, setOrders] = useState([]);
  const [serviceListings, setServiceListings] = useState([]);
  const [serviceProjects, setServiceProjects] = useState([]);
  const [selectedServiceListingId, setSelectedServiceListingId] = useState(null);
  const [serviceBrief, setServiceBrief] = useState("");
  const [serviceSourceMenuId, setServiceSourceMenuId] = useState("");
  const [servicePaymentSession, setServicePaymentSession] = useState(null);
  const [serviceProject, setServiceProject] = useState(null);
  const [creatingServiceIntent, setCreatingServiceIntent] = useState(false);
  const [view, setView] = useState("shop"); // shop | checkout | history | service
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSku, setSelectedSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    shipping_name: "",
    shipping_address_1: "",
    shipping_address_2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "US",
    receipt_email: "",
    door_photo_url: "",
    artwork_url: "",
  });
  const [doorPhotoPreview, setDoorPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [requestingBulk, setRequestingBulk] = useState(false);
  const [error, setError] = useState("");
  const [paymentSession, setPaymentSession] = useState(null);
  const [serverQuote, setServerQuote] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [bulkRequest, setBulkRequest] = useState(null);

  const selectedProduct = useMemo(
    () => catalog.find((p) => p.sku === selectedSku) || null,
    [catalog, selectedSku]
  );

  const selectedServiceListing = useMemo(
    () => serviceListings.find((l) => Number(l.id) === Number(selectedServiceListingId)) || null,
    [serviceListings, selectedServiceListingId]
  );

  const focusMenuDesign =
    searchParams.get("service_category") === "menuply_menu_design" || view === "service";

  const volumeTiers = selectedProduct?.volume_pricing?.tiers || [];
  const isVolume = selectedProduct?.pricing_mode === "volume_tiers";
  const selectedTier = useMemo(() => {
    if (!isVolume) return null;
    return volumeTiers.find((tier) => tier.quantity === quantity) || null;
  }, [isVolume, volumeTiers, quantity]);

  const purchasable = selectedProduct?.availability === "available" && !selectedProduct?.coming_soon;

  const filteredCatalog = useMemo(() => {
    if (categoryFilter === "all") return catalog.filter((p) => !p.is_replacement);
    return catalog.filter((p) => p.category === categoryFilter && !p.is_replacement);
  }, [catalog, categoryFilter]);

  useEffect(() => {
    const menuId = searchParams.get("menu_id");
    if (menuId) setServiceSourceMenuId(String(menuId));
    if (searchParams.get("service_category") === "menuply_menu_design") {
      setView("service");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedRestaurant?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api.getQrMerchandiseCatalog(selectedRestaurant.id),
      api.getProfile(selectedRestaurant.id),
      api.getMarketplaceOrderHistory(selectedRestaurant.id).catch(() => ({ orders: [] })),
      api
        .getMarketplaceServiceListings(selectedRestaurant.id, { category: "menuply_menu_design" })
        .catch(() => ({ listings: [], creative_siblings: FALLBACK_CREATIVE_SERVICES })),
      api.getMarketplaceServiceProjects(selectedRestaurant.id).catch(() => ({ projects: [] })),
    ])
      .then(([catalogResult, profileResult, historyResult, serviceResult, serviceHistory]) => {
        const products = catalogResult?.products || [];
        setCatalog(products);
        setCategories(catalogResult?.categories?.length ? catalogResult.categories : FALLBACK_CATEGORIES);
        setCreativeServices(
          catalogResult?.creative_services?.length
            ? catalogResult.creative_services
            : FALLBACK_CREATIVE_SERVICES
        );
        setFeatured(catalogResult?.featured || products.filter((p) => p.featured).slice(0, 6));
        setOrders(historyResult?.orders || []);
        setServiceListings(serviceResult?.listings || []);
        setServiceProjects(serviceHistory?.projects || []);
        if (products.length && !selectedSku) {
          const firstAvailable = products.find((p) => p.availability === "available") || products[0];
          setSelectedSku(firstAvailable.sku);
          setQuantity(firstAvailable.qty_min || 1);
        }
        const nextProfile = profileResult?.profile || null;
        setProfile(nextProfile);
        setForm((current) => ({
          ...current,
          shipping_name: current.shipping_name || nextProfile?.restaurant_name || "",
          shipping_address_1: current.shipping_address_1 || nextProfile?.address_line1 || "",
          shipping_address_2: current.shipping_address_2 || nextProfile?.address_line2 || "",
          shipping_city: current.shipping_city || nextProfile?.city || "",
          shipping_state: current.shipping_state || nextProfile?.state || "",
          shipping_postal_code: current.shipping_postal_code || nextProfile?.postal_code || "",
          shipping_country: current.shipping_country || "US",
          receipt_email: current.receipt_email || nextProfile?.email || "",
        }));
      })
      .catch((err) => setError(err.message || "Unable to load Marketplace catalog."))
      .finally(() => setLoading(false));
  }, [selectedRestaurant?.id]);

  useEffect(() => {
    if (!selectedProduct) return;
    if (selectedProduct.pricing_mode === "volume_tiers" && selectedProduct.qty_options?.length) {
      setQuantity(selectedProduct.qty_options[0]);
    } else {
      setQuantity(selectedProduct.qty_min || 1);
    }
    setPaymentSession(null);
    setServerQuote(null);
    setPreviewQuote(null);
    setBulkRequest(null);
  }, [selectedProduct?.sku]);

  useEffect(() => {
    if (!selectedRestaurant?.id || !selectedProduct || !purchasable) {
      setPreviewQuote(null);
      return;
    }
    let cancelled = false;
    api
      .getQrMerchandiseQuote(selectedRestaurant.id, {
        sku: selectedProduct.sku,
        quantity,
      })
      .then((result) => {
        if (!cancelled) setPreviewQuote(result.quote || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewQuote({
            error: err.message,
            code: err.payload?.code || err.code,
            bulk_quote_required: true,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRestaurant?.id, selectedProduct?.sku, quantity, purchasable]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleArtworkChange(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedRestaurant?.id) return;
    setDoorPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const result = await api.uploadMarketplaceArtwork(selectedRestaurant.id, file);
      const url = result.artwork_url || result.door_photo_url;
      setField("artwork_url", url);
      setField("door_photo_url", url);
    } catch (err) {
      setError(err.message || "Artwork upload failed.");
      setDoorPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function validateForm() {
    if (!selectedRestaurant?.id) return "Select a restaurant before ordering.";
    if (!selectedProduct || !purchasable) return "Select an available Marketplace product.";
    if (!hasStripePublishableKey()) return "VITE_STRIPE_PUBLISHABLE_KEY is not configured.";
    for (const field of [
      "shipping_name",
      "shipping_address_1",
      "shipping_city",
      "shipping_state",
      "shipping_postal_code",
      "shipping_country",
    ]) {
      if (!String(form[field] || "").trim()) return `${field} is required.`;
    }
    return null;
  }

  const needsBulkQuote =
    Boolean(previewQuote?.bulk_quote_required) ||
    (selectedTier && selectedTier.self_service_eligible === false) ||
    previewQuote?.checkout_allowed === false;

  async function handleCreatePaymentIntent(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (needsBulkQuote) {
      setError("This quantity requires a bulk quote. Use Request Bulk Quote — no payment will be created.");
      return;
    }

    setCreatingIntent(true);
    setError("");
    setConfirmation(null);
    setServerQuote(null);

    try {
      const response = await api.createPlatformPaymentIntent({
        restaurantId: selectedRestaurant.id,
        productCode: selectedProduct.sku,
        quantity,
        receiptEmail: form.receipt_email || undefined,
        metadata: {
          source: "operator_marketplace",
          payment_type: "marketplace_product",
          merchandise_sku: selectedProduct.sku,
        },
      });

      setPaymentSession(response);
      setServerQuote(response.merchandise || null);
    } catch (err) {
      const code = err.payload?.code || err.code || "";
      if (code === "MERCHANDISE_QUOTE_REQUIRED") {
        setError(err.message || "Bulk quote required — PaymentIntent was not created.");
      } else {
        setError(err.message || "Unable to prepare Marketplace payment.");
      }
    } finally {
      setCreatingIntent(false);
    }
  }

  async function handleBulkQuoteRequest() {
    if (!selectedRestaurant?.id || !selectedProduct) return;
    setRequestingBulk(true);
    setError("");
    try {
      const result = await api.requestQrMerchandiseBulkQuote(selectedRestaurant.id, {
        sku: selectedProduct.sku,
        quantity,
        contact_email: form.receipt_email || undefined,
        note: "Operator requested bulk quote from Marketplace.",
      });
      setBulkRequest(result.request || result);
      setPaymentSession(null);
    } catch (err) {
      setError(err.message || "Unable to submit bulk quote request.");
    } finally {
      setRequestingBulk(false);
    }
  }

  async function handlePaymentConfirmed(paymentIntent) {
    if (!selectedRestaurant?.id || !selectedProduct) return;
    setError("");

    try {
      const result = await api.createQrKitOrder(selectedRestaurant.id, {
        sku: selectedProduct.sku,
        quantity,
        shipping_name: form.shipping_name,
        shipping_address_1: form.shipping_address_1,
        shipping_address_2: form.shipping_address_2,
        shipping_city: form.shipping_city,
        shipping_state: form.shipping_state,
        shipping_postal_code: form.shipping_postal_code,
        shipping_country: form.shipping_country,
        stripe_payment_intent_id: paymentIntent.id,
        artwork_url: form.artwork_url || undefined,
        door_photo_url: form.door_photo_url || undefined,
      });

      setConfirmation(result);
      setPaymentSession(null);
      setView("shop");
      const history = await api.getMarketplaceOrderHistory(selectedRestaurant.id).catch(() => null);
      if (history?.orders) setOrders(history.orders);
    } catch (err) {
      setError(err.message || "Payment succeeded, but Marketplace order could not be created.");
    }
  }

  function selectProduct(product) {
    setSelectedSku(product.sku);
    setConfirmation(null);
    setServicePaymentSession(null);
    if (product.availability === "available") {
      setView("checkout");
    } else {
      setView("shop");
      setError("");
    }
  }

  function openMenuDesign() {
    setView("service");
    setError("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("service_category", "menuply_menu_design");
      return next;
    });
  }

  async function handleServiceCheckout(event) {
    event.preventDefault();
    if (!selectedRestaurant?.id || !selectedServiceListing) {
      setError("Select a Menuply Menu Design listing.");
      return;
    }
    if (!hasStripePublishableKey()) {
      setError("VITE_STRIPE_PUBLISHABLE_KEY is not configured.");
      return;
    }
    setCreatingServiceIntent(true);
    setError("");
    setServicePaymentSession(null);
    try {
      const result = await api.checkoutMarketplaceService(selectedRestaurant.id, {
        listing_id: selectedServiceListing.id,
        project_brief: serviceBrief,
        source_menu_id: serviceSourceMenuId ? Number(serviceSourceMenuId) : undefined,
        receipt_email: form.receipt_email || undefined,
      });
      setServiceProject(result.project);
      setServicePaymentSession(result.payment_intent || {
        id: result.client_secret ? result.payment_intent?.id : null,
        client_secret: result.client_secret,
      });
      if (result.client_secret && !result.payment_intent?.client_secret) {
        setServicePaymentSession({
          id: result.payment_intent?.id,
          client_secret: result.client_secret,
        });
      }
    } catch (err) {
      setError(err.message || "Unable to start Menu Design checkout.");
    } finally {
      setCreatingServiceIntent(false);
    }
  }

  async function handleServicePaymentConfirmed(paymentIntent) {
    if (!selectedRestaurant?.id || !serviceProject?.id) return;
    setError("");
    try {
      const result = await api.confirmMarketplaceServiceProject(
        selectedRestaurant.id,
        serviceProject.id,
        { stripe_payment_intent_id: paymentIntent.id }
      );
      setConfirmation({
        service: true,
        project: result.project,
        message: result.message,
      });
      setServicePaymentSession(null);
      const history = await api.getMarketplaceServiceProjects(selectedRestaurant.id).catch(() => null);
      if (history?.projects) setServiceProjects(history.projects);
      setView("service");
    } catch (err) {
      setError(err.message || "Payment succeeded, but service project could not be confirmed.");
    }
  }

  if (!selectedRestaurant) {
    return (
      <OperatorLayout title={t("operator.nav.marketplace") || "Marketplace"}>
        <div style={{ maxWidth: 560, background: "#fff", border: "1px solid #eaecf0", borderRadius: 20, padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: "#101828" }}>No restaurant selected</h2>
        </div>
      </OperatorLayout>
    );
  }

  const displayUnit = previewQuote?.unit_amount_cents ?? selectedTier?.retail_unit_price_cents ?? null;
  const displaySubtotal = previewQuote?.subtotal_cents ?? selectedTier?.retail_total_cents ?? null;

  return (
    <OperatorLayout title={t("operator.nav.marketplace") || "Marketplace"}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }} data-testid="marketplace-page">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.03em", color: "#101828" }}>Marketplace</h1>
            <p style={{ color: "#475467", lineHeight: 1.6, marginTop: 8, maxWidth: 640 }}>
              Products and creative services for your restaurant. Menuply is the seller; fulfillment is handled after payment.
              Orders remain awaiting fulfillment until a supplier is configured.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setView("shop")} style={tabBtn(view === "shop" || view === "checkout")}>
              Shop
            </button>
            <button
              type="button"
              onClick={openMenuDesign}
              style={tabBtn(view === "service")}
              data-testid="marketplace-menu-design-tab"
            >
              Menu Design
            </button>
            <button type="button" onClick={() => setView("history")} style={tabBtn(view === "history")} data-testid="marketplace-orders-tab">
              Orders
            </button>
          </div>
        </div>

        {error ? (
          <div style={{ marginTop: 16, background: "#fef3f2", border: "1px solid #fecdca", color: "#b42318", borderRadius: 16, padding: 14 }}>
            {error}
          </div>
        ) : null}

        {loading ? <p>Loading Marketplace…</p> : null}

        {confirmation?.service ? (
          <section style={{ marginTop: 20, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 22, padding: 22 }} data-testid="marketplace-service-confirmation">
            <h2 style={{ margin: 0 }}>Menu Design purchase confirmed</h2>
            <p style={{ color: "#166534", lineHeight: 1.5 }}>
              {confirmation.message || "Project is paid. Your provider can begin work. No shipping or VistaPrint fulfillment."}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 16 }}>
              <InfoTile label="Project" value={confirmation.project?.title_snapshot || `#${confirmation.project?.id}`} />
              <InfoTile label="Status" value={confirmation.project?.status || "paid"} />
              <InfoTile label="Charged" value={formatMoney(confirmation.project?.price_snapshot_cents)} />
            </div>
          </section>
        ) : null}

        {confirmation && !confirmation.service ? (
          <section style={{ marginTop: 20, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 22, padding: 22 }} data-testid="marketplace-order-confirmation">
            <h2 style={{ margin: 0 }}>Payment received</h2>
            <p style={{ color: "#166534", lineHeight: 1.5 }}>
              Your Marketplace order is recorded as awaiting fulfillment. It has not been submitted to a supplier yet.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 16 }}>
              <InfoTile label="Product" value={confirmation.order?.product_name_snapshot || confirmation.order?.sku || "—"} />
              <InfoTile label="Qty" value={String(confirmation.order?.quantity ?? "—")} />
              <InfoTile label="Charged" value={formatMoney(confirmation.order?.stripe_amount_cents ?? confirmation.order?.amount_cents)} />
              <InfoTile label="Payment" value={confirmation.order?.payment_status || "payment_received"} />
              <InfoTile label="Fulfillment" value={confirmation.order?.fulfillment_status || "awaiting_fulfillment"} />
            </div>
          </section>
        ) : null}

        {bulkRequest ? (
          <section style={{ marginTop: 20, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 22, padding: 22 }}>
            <h2 style={{ margin: 0 }}>Bulk quote requested</h2>
            <p style={{ color: "#1e3a8a", lineHeight: 1.5 }}>
              Quantity {bulkRequest.quantity} for {bulkRequest.sku} is held for Menuply confirmation. No payment was taken.
            </p>
          </section>
        ) : null}

        {view === "history" ? (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ marginTop: 0 }}>Marketplace Orders</h2>
            {!orders.length ? (
              <p style={{ color: "#667085" }}>No Marketplace orders yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 18, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>Order #{order.id}</div>
                        <div style={{ color: "#667085", fontSize: 13, marginTop: 4 }}>
                          {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800 }}>{formatMoney(order.stripe_amount_cents ?? order.amount_cents)}</div>
                        <div style={{ fontSize: 13, color: "#667085" }}>
                          {order.payment_status || "—"} · {order.fulfillment_status || order.status || "—"}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 14 }}>
                      {(order.items || []).length
                        ? order.items.map((item) => `${item.product_name_snapshot} × ${item.quantity}`).join(", ")
                        : `${order.product_name_snapshot || order.sku || "Product"} × ${order.quantity ?? 1}`}
                    </div>
                    {order.tracking_number ? (
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        Tracking: {order.tracking_url ? (
                          <a href={order.tracking_url} target="_blank" rel="noreferrer">{order.tracking_number}</a>
                        ) : order.tracking_number}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ marginTop: 28 }}>Menu Design Projects</h2>
            {!serviceProjects.length ? (
              <p style={{ color: "#667085" }}>No Menu Design projects yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {serviceProjects.map((project) => (
                  <div
                    key={project.id}
                    data-testid={`service-project-${project.id}`}
                    style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 18, padding: 16 }}
                  >
                    <div style={{ fontWeight: 800 }}>{project.title_snapshot}</div>
                    <div style={{ color: "#667085", marginTop: 4 }}>
                      {project.status} · {formatMoney(project.price_snapshot_cents)} ·{" "}
                      {project.provider_display_name || `Provider #${project.provider_id}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : view === "service" || focusMenuDesign ? (
          <section style={{ marginTop: 28 }} data-testid="marketplace-menu-design-panel">
            <h2 style={{ margin: "0 0 8px" }}>Menuply Menu Design</h2>
            <p style={{ color: "#667085", marginTop: 0 }}>
              Fixed-price redesigns from approved providers. Photography and Social Media Graphics remain Coming Soon.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
              {(creativeServices.length ? creativeServices : FALLBACK_CREATIVE_SERVICES).map((service) => {
                const isMenuDesign =
                  service.id === "menuply_menu_design" || service.category === "menuply_menu_design";
                const comingSoon = !isMenuDesign || service.status === "coming_soon";
                return (
                  <div
                    key={service.id}
                    data-testid={`creative-service-${service.id}`}
                    style={{
                      background: isMenuDesign ? "#f3faf6" : "#fff",
                      border: isMenuDesign ? "2px solid #1f4e3d" : "1px solid #eaecf0",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{service.name}</div>
                    <div style={{ color: "#667085", marginTop: 8, fontSize: 14 }}>{service.short_description}</div>
                    <div style={{ marginTop: 12, fontWeight: 800, color: comingSoon ? "#b54708" : "#1f4e3d" }}>
                      {comingSoon ? "Coming Soon" : "Available"}
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 style={{ margin: "0 0 12px" }}>Available providers</h3>
            {!serviceListings.length ? (
              <p style={{ color: "#667085" }}>
                No approved Menu Design listings are live yet. Providers set their own fixed prices after CRM approval.
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                {serviceListings.map((listing) => (
                  <button
                    key={listing.id}
                    type="button"
                    data-testid={`service-listing-${listing.slug || listing.id}`}
                    onClick={() => {
                      setSelectedServiceListingId(listing.id);
                      setServicePaymentSession(null);
                      setServiceProject(null);
                    }}
                    style={{
                      textAlign: "left",
                      borderRadius: 18,
                      border:
                        Number(selectedServiceListingId) === Number(listing.id)
                          ? "2px solid #1f4e3d"
                          : "1px solid #d0d5dd",
                      background: "#fff",
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{listing.title}</div>
                    <div style={{ color: "#667085", marginTop: 6, fontSize: 14 }}>
                      {listing.provider?.display_name || "Provider"} · {listing.turnaround_days} days ·{" "}
                      {listing.revision_count} revisions
                    </div>
                    <div style={{ marginTop: 10, fontWeight: 800, color: "#1f4e3d" }}>
                      {formatMoney(listing.fixed_price_cents)}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedServiceListing ? (
              <form
                onSubmit={handleServiceCheckout}
                style={{
                  marginTop: 24,
                  background: "#fff",
                  border: "1px solid #eaecf0",
                  borderRadius: 22,
                  padding: 22,
                  display: "grid",
                  gap: 12,
                }}
                data-testid="marketplace-service-checkout"
              >
                <h3 style={{ margin: 0 }}>{selectedServiceListing.title}</h3>
                <p style={{ margin: 0, color: "#667085" }}>
                  {selectedServiceListing.full_description || selectedServiceListing.short_description}
                </p>
                <div style={{ background: "#f9fafb", borderRadius: 14, padding: 14 }}>
                  <strong>Fixed price:</strong> {formatMoney(selectedServiceListing.fixed_price_cents)}
                  <div style={{ marginTop: 6, fontSize: 13, color: "#667085" }}>
                    Platform PaymentIntent only · payment_type=marketplace_service · no shipping
                  </div>
                </div>
                <label>
                  <span style={labelStyle()}>Project brief</span>
                  <textarea
                    value={serviceBrief}
                    onChange={(e) => setServiceBrief(e.target.value)}
                    style={{ ...inputStyle(), minHeight: 100 }}
                    placeholder="Describe your menu redesign goals…"
                  />
                </label>
                <label>
                  <span style={labelStyle()}>Source menu id (optional)</span>
                  <input
                    value={serviceSourceMenuId}
                    onChange={(e) => setServiceSourceMenuId(e.target.value)}
                    style={inputStyle()}
                    placeholder="menu_id"
                  />
                </label>
                <label>
                  <span style={labelStyle()}>Receipt email</span>
                  <input
                    value={form.receipt_email}
                    onChange={(e) => setField("receipt_email", e.target.value)}
                    style={inputStyle()}
                  />
                </label>
                <button type="submit" disabled={creatingServiceIntent} style={primaryBtn("#1f4e3d")}>
                  {creatingServiceIntent
                    ? "Preparing payment…"
                    : `Purchase · ${formatMoney(selectedServiceListing.fixed_price_cents)}`}
                </button>
                {servicePaymentSession?.client_secret ? (
                  <div style={{ marginTop: 8 }}>
                    <StripeElementsProvider options={{ clientSecret: servicePaymentSession.client_secret }}>
                      <PlatformPaymentForm onConfirmed={handleServicePaymentConfirmed} />
                    </StripeElementsProvider>
                  </div>
                ) : null}
              </form>
            ) : null}
          </section>
        ) : (
          <>
            <section style={{ marginTop: 28 }}>
              <h2 style={{ margin: "0 0 12px" }}>Featured Products</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {(featured.length ? featured : filteredCatalog.slice(0, 4)).map((product) => (
                  <ProductCard
                    key={`featured-${product.sku}`}
                    product={product}
                    active={product.sku === selectedSku}
                    onSelect={selectProduct}
                  />
                ))}
              </div>
            </section>

            <section style={{ marginTop: 28 }}>
              <h2 style={{ margin: "0 0 12px" }}>Shop by Category</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <button type="button" onClick={() => setCategoryFilter("all")} style={chipBtn(categoryFilter === "all")}>All</button>
                {(categories.length ? categories : FALLBACK_CATEGORIES).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    style={chipBtn(categoryFilter === cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {filteredCatalog.map((product) => (
                  <ProductCard
                    key={product.sku}
                    product={product}
                    active={product.sku === selectedSku}
                    onSelect={selectProduct}
                  />
                ))}
              </div>
            </section>

            <section style={{ marginTop: 28 }}>
              <h2 style={{ margin: "0 0 12px" }}>Creative Services</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {(creativeServices.length ? creativeServices : FALLBACK_CREATIVE_SERVICES).map((service) => {
                  const isMenuDesign =
                    service.id === "menuply_menu_design" || service.category === "menuply_menu_design";
                  return (
                    <div
                      key={service.id}
                      data-testid={`creative-service-${service.id}`}
                      style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 18, padding: 16 }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{service.name}</div>
                      <div style={{ color: "#667085", marginTop: 8, fontSize: 14 }}>{service.short_description}</div>
                      {isMenuDesign ? (
                        <button
                          type="button"
                          onClick={openMenuDesign}
                          style={{
                            marginTop: 12,
                            border: "none",
                            background: "transparent",
                            color: "#1f4e3d",
                            fontWeight: 800,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Browse Menu Design →
                        </button>
                      ) : (
                        <div style={{ marginTop: 12, fontWeight: 800, color: "#b54708" }}>Coming Soon</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {view === "checkout" && selectedProduct && purchasable ? (
              <section style={{ marginTop: 28, background: "#fff", border: "1px solid #eaecf0", borderRadius: 22, padding: 22 }}>
                <h2 style={{ marginTop: 0 }}>{selectedProduct.public_name}</h2>
                <p style={{ color: "#667085" }}>{selectedProduct.short_description || selectedProduct.description}</p>

                {isVolume && volumeTiers.length ? (
                  <label style={{ display: "block", marginTop: 18 }}>
                    <span style={labelStyle()}>Quantity (volume tier)</span>
                    <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} style={inputStyle()}>
                      {volumeTiers.map((tier) => (
                        <option key={tier.tier_id || tier.quantity} value={tier.quantity}>
                          {tier.label || `${tier.quantity} — ${formatMoney(tier.retail_total_cents)}`}
                          {!tier.self_service_eligible ? " (bulk quote)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : selectedProduct?.qty_max > 1 ? (
                  <label style={{ display: "block", marginTop: 18 }}>
                    <span style={labelStyle()}>Quantity</span>
                    <input
                      type="number"
                      min={selectedProduct.qty_min}
                      max={selectedProduct.qty_max}
                      step={selectedProduct.qty_step}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      style={inputStyle()}
                    />
                  </label>
                ) : null}

                <div style={{ marginTop: 16, background: "#f9fafb", borderRadius: 16, padding: 16 }}>
                  <div><strong>Quantity:</strong> {quantity}</div>
                  <div><strong>Unit price:</strong> {displayUnit != null ? formatMoney(displayUnit) : "—"}</div>
                  <div><strong>Subtotal:</strong> {displaySubtotal != null ? formatMoney(displaySubtotal) : "—"}</div>
                  {serverQuote ? (
                    <div style={{ marginTop: 8, color: "#166534" }}>
                      <strong>Server-confirmed amount due:</strong> {formatMoney(serverQuote.subtotal_cents)}
                    </div>
                  ) : null}
                  <div style={{ marginTop: 8, fontSize: 13, color: "#667085" }}>
                    Tax: not included · Shipping charge: not included
                  </div>
                </div>

                <form onSubmit={handleCreatePaymentIntent} style={{ marginTop: 20, display: "grid", gap: 12 }}>
                  {[
                    ["shipping_name", "Ship to name"],
                    ["shipping_address_1", "Address line 1"],
                    ["shipping_address_2", "Address line 2"],
                    ["shipping_city", "City"],
                    ["shipping_state", "State"],
                    ["shipping_postal_code", "Postal code"],
                    ["shipping_country", "Country"],
                    ["receipt_email", "Receipt email"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      <span style={labelStyle()}>{label}</span>
                      <input style={inputStyle()} value={form[key]} onChange={(e) => setField(key, e.target.value)} />
                    </label>
                  ))}

                  <label>
                    <span style={labelStyle()}>Artwork / photo (optional)</span>
                    <input type="file" accept="image/*" onChange={handleArtworkChange} disabled={uploadingPhoto} />
                    {doorPhotoPreview ? (
                      <img src={doorPhotoPreview} alt="Artwork preview" style={{ marginTop: 8, maxWidth: 180, borderRadius: 12 }} />
                    ) : null}
                  </label>

                  {needsBulkQuote ? (
                    <button
                      type="button"
                      onClick={handleBulkQuoteRequest}
                      disabled={requestingBulk || !selectedProduct}
                      style={primaryBtn("#1d4ed8")}
                    >
                      {requestingBulk ? "Submitting…" : "Request Bulk Quote"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={creatingIntent || !selectedProduct}
                      style={primaryBtn("#1f4e3d")}
                    >
                      {creatingIntent
                        ? "Preparing payment…"
                        : displaySubtotal != null
                          ? `Continue to payment · ${formatMoney(displaySubtotal)}`
                          : "Continue to payment"}
                    </button>
                  )}
                </form>

                {paymentSession?.client_secret ? (
                  <div style={{ marginTop: 20 }}>
                    <StripeElementsProvider options={{ clientSecret: paymentSession.client_secret }}>
                      <PlatformPaymentForm onConfirmed={handlePaymentConfirmed} />
                    </StripeElementsProvider>
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </div>
    </OperatorLayout>
  );
}

function tabBtn(active) {
  return {
    minHeight: 40,
    padding: "0 16px",
    borderRadius: 12,
    border: active ? "2px solid #1f4e3d" : "1px solid #d0d5dd",
    background: active ? "#f3faf6" : "#fff",
    color: "#101828",
    fontWeight: 800,
    cursor: "pointer",
  };
}

function chipBtn(active) {
  return {
    minHeight: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: active ? "2px solid #1f4e3d" : "1px solid #d0d5dd",
    background: active ? "#f3faf6" : "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };
}

function primaryBtn(background) {
  return {
    minHeight: 48,
    borderRadius: 14,
    border: "none",
    background,
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  };
}
