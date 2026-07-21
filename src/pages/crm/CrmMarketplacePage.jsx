import { useEffect, useState } from "react";
import CrmLayout from "./CrmLayout.jsx";
import * as crmApi from "../../lib/crmApi.js";

export default function CrmMarketplacePage() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [listings, setListings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    slug: "",
    public_name: "",
    category: "qr_products",
    short_description: "",
    unit_amount_cents: 0,
    supplier_cost_cents: "",
    active: false,
    sellable: false,
    featured: false,
    display_order: 100,
  });

  async function load() {
    setError("");
    try {
      const [productResult, orderResult, providerResult, listingResult, projectResult] =
        await Promise.all([
          crmApi.getCrmMarketplaceProducts(),
          crmApi.getCrmMarketplaceOrders(),
          crmApi.getCrmMarketplaceProviders().catch(() => ({ providers: [] })),
          crmApi.getCrmMarketplaceServiceListings().catch(() => ({ listings: [] })),
          crmApi.getCrmMarketplaceServiceProjects().catch(() => ({ projects: [] })),
        ]);
      setProducts(productResult?.products || []);
      setOrders(orderResult?.orders || []);
      setProviders(providerResult?.providers || []);
      setListings(listingResult?.listings || []);
      setProjects(projectResult?.projects || []);
    } catch (err) {
      setError(err.message || "Unable to load Marketplace admin data.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await crmApi.createCrmMarketplaceProduct({
        ...form,
        supplier_cost_cents:
          form.supplier_cost_cents === "" ? null : Number(form.supplier_cost_cents),
        unit_amount_cents: Number(form.unit_amount_cents || 0),
      });
      setForm({
        sku: "",
        slug: "",
        public_name: "",
        category: "qr_products",
        short_description: "",
        unit_amount_cents: 0,
        supplier_cost_cents: "",
        active: false,
        sellable: false,
        featured: false,
        display_order: 100,
      });
      await load();
    } catch (err) {
      setError(err.message || "Unable to create product.");
    } finally {
      setSaving(false);
    }
  }

  async function patchProduct(sku, body) {
    setError("");
    try {
      await crmApi.updateCrmMarketplaceProduct(sku, body);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update product.");
    }
  }

  async function patchOrder(id, body) {
    setError("");
    try {
      await crmApi.updateCrmMarketplaceOrder(id, body);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update order.");
    }
  }

  async function patchProvider(id, body) {
    setError("");
    try {
      await crmApi.updateCrmMarketplaceProvider(id, body);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update provider.");
    }
  }

  async function patchListing(id, body) {
    setError("");
    try {
      await crmApi.updateCrmMarketplaceServiceListing(id, body);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update listing.");
    }
  }

  async function patchProject(id, body) {
    setError("");
    try {
      await crmApi.updateCrmMarketplaceServiceProject(id, body);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update project.");
    }
  }

  return (
    <CrmLayout title="Marketplace">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          ["products", "Products"],
          ["orders", "Orders"],
          ["providers", "Providers"],
          ["listings", "Service listings"],
          ["projects", "Service projects"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div style={{ background: "#fef3f2", border: "1px solid #fecdca", color: "#b42318", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          {error}
        </div>
      ) : null}

      {tab === "products" ? (
        <div style={{ display: "grid", gap: 18 }}>
          <form onSubmit={handleCreate} style={{ background: "#fff", borderRadius: 16, padding: 16, display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0 }}>Create product</h3>
            {["sku", "slug", "public_name", "category", "short_description"].map((key) => (
              <input
                key={key}
                placeholder={key}
                value={form[key]}
                onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
              />
            ))}
            <input
              type="number"
              placeholder="retail unit_amount_cents"
              value={form.unit_amount_cents}
              onChange={(e) => setForm((current) => ({ ...current, unit_amount_cents: e.target.value }))}
            />
            <input
              type="number"
              placeholder="supplier_cost_cents (internal only)"
              value={form.supplier_cost_cents}
              onChange={(e) => setForm((current) => ({ ...current, supplier_cost_cents: e.target.value }))}
            />
            <label>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((current) => ({ ...current, active: e.target.checked }))}
              />{" "}
              Active
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.sellable}
                onChange={(e) => setForm((current) => ({ ...current, sellable: e.target.checked }))}
              />{" "}
              Sellable
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((current) => ({ ...current, featured: e.target.checked }))}
              />{" "}
              Featured
            </label>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : "Create product"}</button>
          </form>

          <div style={{ display: "grid", gap: 10 }}>
            {products.map((product) => (
              <div key={product.sku} style={{ background: "#fff", borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 800 }}>{product.public_name || product.name} · {product.sku}</div>
                <div style={{ fontSize: 13, color: "#667085" }}>
                  {product.category} · retail {product.unit_amount_cents ?? "—"}¢ · cost {product.supplier_cost_cents ?? "—"}¢ · order {product.display_order}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => patchProduct(product.sku, { active: !product.active })}>
                    {product.active ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" onClick={() => patchProduct(product.sku, { sellable: !product.sellable })}>
                    {product.sellable ? "Mark not sellable" : "Mark sellable"}
                  </button>
                  <button type="button" onClick={() => patchProduct(product.sku, { featured: !product.featured })}>
                    {product.featured ? "Unfeature" : "Feature"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "orders" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {orders.map((order) => (
            <div key={order.id} style={{ background: "#fff", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 800 }}>#{order.id} · {order.restaurant_name || order.restaurant_id}</div>
              <div style={{ fontSize: 13, color: "#667085" }}>
                {order.product_name_snapshot || order.sku} · {order.amount_cents}¢ · {order.payment_status} / {order.fulfillment_status || order.status}
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                <select
                  defaultValue={order.fulfillment_status || "awaiting_fulfillment"}
                  onChange={(e) => patchOrder(order.id, { fulfillment_status: e.target.value, status: e.target.value })}
                >
                  {[
                    "payment_received",
                    "awaiting_artwork",
                    "awaiting_fulfillment",
                    "submitted_to_supplier",
                    "in_production",
                    "shipped",
                    "delivered",
                    "cancelled",
                    "refunded",
                    "failed",
                  ].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <input
                  placeholder="Supplier order ID"
                  defaultValue={order.supplier_order_id || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (order.supplier_order_id || "")) {
                      patchOrder(order.id, { supplier_order_id: e.target.value || null });
                    }
                  }}
                />
                <input
                  placeholder="Tracking number"
                  defaultValue={order.tracking_number || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (order.tracking_number || "")) {
                      patchOrder(order.id, { tracking_number: e.target.value || null });
                    }
                  }}
                />
                <input
                  placeholder="Tracking URL"
                  defaultValue={order.tracking_url || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (order.tracking_url || "")) {
                      patchOrder(order.id, { tracking_url: e.target.value || null });
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "providers" ? (
        <div style={{ display: "grid", gap: 10 }} data-testid="crm-marketplace-providers">
          {!providers.length ? <p>No provider profiles yet.</p> : null}
          {providers.map((provider) => (
            <div key={provider.id} style={{ background: "#fff", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 800 }}>
                {provider.display_name} · #{provider.id}
              </div>
              <div style={{ fontSize: 13, color: "#667085" }}>
                {provider.consumer_email || `user ${provider.user_id}`} · {provider.approval_status} ·{" "}
                {provider.active ? "active" : "inactive"}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => patchProvider(provider.id, { approval_status: "approved", active: true })}>
                  Approve + activate
                </button>
                <button type="button" onClick={() => patchProvider(provider.id, { approval_status: "rejected", active: false })}>
                  Reject
                </button>
                <button type="button" onClick={() => patchProvider(provider.id, { approval_status: "suspended", active: false })}>
                  Suspend
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "listings" ? (
        <div style={{ display: "grid", gap: 10 }} data-testid="crm-marketplace-service-listings">
          {!listings.length ? <p>No service listings yet.</p> : null}
          {listings.map((listing) => (
            <div key={listing.id} style={{ background: "#fff", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 800 }}>{listing.title} · #{listing.id}</div>
              <div style={{ fontSize: 13, color: "#667085" }}>
                {listing.provider_display_name || `provider ${listing.provider_id}`} · {listing.fixed_price_cents}¢ ·{" "}
                {listing.active ? "active" : "inactive"} · provider {listing.provider_approval_status}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={() => patchListing(listing.id, { active: !listing.active })}>
                  {listing.active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" onClick={() => patchListing(listing.id, { featured: !listing.featured })}>
                  {listing.featured ? "Unfeature" : "Feature"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "projects" ? (
        <div style={{ display: "grid", gap: 10 }} data-testid="crm-marketplace-service-projects">
          {!projects.length ? <p>No service projects yet.</p> : null}
          {projects.map((project) => (
            <div key={project.id} style={{ background: "#fff", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 800 }}>
                #{project.id} · {project.title_snapshot}
              </div>
              <div style={{ fontSize: 13, color: "#667085" }}>
                {project.restaurant_name || project.restaurant_id} · {project.provider_display_name || project.provider_id} ·{" "}
                {project.status} · payout {project.provider_payout_status} · {project.price_snapshot_cents}¢
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                <select
                  defaultValue={project.status}
                  onChange={(e) => patchProject(project.id, { status: e.target.value })}
                >
                  {["pending_payment", "paid", "in_progress", "delivered", "approved", "cancelled", "refunded"].map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )
                  )}
                </select>
                <input
                  placeholder="Delivery file URL"
                  defaultValue={project.delivery_file_url || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (project.delivery_file_url || "")) {
                      patchProject(project.id, { delivery_file_url: e.target.value || null });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    patchProject(project.id, {
                      provider_payout_status:
                        project.provider_payout_status === "marked_paid" ? "unpaid" : "marked_paid",
                    })
                  }
                >
                  {project.provider_payout_status === "marked_paid"
                    ? "Mark payout unpaid"
                    : "Mark payout paid (manual)"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </CrmLayout>
  );
}
