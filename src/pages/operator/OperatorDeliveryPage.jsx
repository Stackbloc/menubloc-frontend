import React, { useEffect, useMemo, useState } from "react";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  disconnectDeliveryProviderAccount,
  getDeliverySettings,
  saveDeliveryProviderAccount,
  updateDeliverySettings,
} from "../../lib/operatorApi.js";

const PROVIDERS = [
  {
    key: "uber_direct",
    label: "Uber Direct",
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client Secret" },
      { key: "customerId", label: "Customer / Account ID" },
    ],
  },
  {
    key: "doordash_drive",
    label: "DoorDash Drive",
    fields: [
      { key: "developerId", label: "Developer ID" },
      { key: "keyId", label: "Key ID" },
      { key: "signingSecret", label: "Signing Secret" },
    ],
  },
];

function providerDefaults(provider) {
  return {
    accountLabel: "",
    businessName: "",
    contactEmail: "",
    externalBusinessId: "",
    externalStoreId: "",
    externalAccountId: "",
    accountStatus: "pending",
    isEnabled: false,
    isDefault: false,
    credentials: {},
  };
}

function providerStateFromAccount(account, provider) {
  const base = providerDefaults(provider);
  const credentials = {};
  const fields = PROVIDERS.find((entry) => entry.key === provider)?.fields || [];
  for (const field of fields) {
    credentials[field.key] = "";
  }

  return {
    ...base,
    accountLabel: account?.account_label || "",
    businessName: account?.business_name || "",
    contactEmail: account?.contact_email || "",
    externalBusinessId: account?.external_business_id || "",
    externalStoreId: account?.external_store_id || "",
    externalAccountId: account?.external_account_id || "",
    accountStatus: account?.account_status || "pending",
    isEnabled: account?.is_enabled === true,
    isDefault: account?.is_default === true,
    credentials,
  };
}

function StatusPill({ value }) {
  const normalized = String(value || "").toLowerCase();
  const style =
    normalized === "connected"
      ? { background: "#dcfce7", color: "#166534" }
      : normalized === "disabled"
        ? { background: "#e5e7eb", color: "#374151" }
        : normalized === "error"
          ? { background: "#fee2e2", color: "#991b1b" }
          : { background: "#fef3c7", color: "#92400e" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 800,
        textTransform: "capitalize",
        ...style,
      }}
    >
      {normalized || "pending"}
    </span>
  );
}

function ProviderCard({
  provider,
  savedAccount,
  formState,
  onChange,
  onSave,
  onDisconnect,
  busyKey,
}) {
  const providerDef = PROVIDERS.find((entry) => entry.key === provider);
  if (!providerDef) return null;

  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 18,
        border: "1px solid #e4e9f0",
        padding: "18px 18px 16px",
        boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
      }}
    >
      <div className="operator-responsive-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f1720" }}>{providerDef.label}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#5b6675", lineHeight: 1.5 }}>
            This restaurant owns the provider relationship. Menuply only dispatches through the restaurant’s connected account.
          </div>
        </div>
        <div className="operator-responsive-status" style={{ textAlign: "right" }}>
          <StatusPill value={savedAccount?.account_status || formState.accountStatus} />
          <div style={{ marginTop: 8, fontSize: 12, color: "#667085" }}>
            {savedAccount?.credentials_last4 ? `Saved credential ending in ${savedAccount.credentials_last4}` : "No credential stored yet"}
          </div>
        </div>
      </div>

      <div className="operator-responsive-grid-4" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Account label</span>
          <input value={formState.accountLabel} onChange={(event) => onChange("accountLabel", event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Business name</span>
          <input value={formState.businessName} onChange={(event) => onChange("businessName", event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Contact email</span>
          <input value={formState.contactEmail} onChange={(event) => onChange("contactEmail", event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Account status</span>
          <select value={formState.accountStatus} onChange={(event) => onChange("accountStatus", event.target.value)} style={inputStyle}>
            <option value="pending">Pending</option>
            <option value="connected">Connected</option>
            <option value="error">Error</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>External business ID</span>
          <input value={formState.externalBusinessId} onChange={(event) => onChange("externalBusinessId", event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>External store ID</span>
          <input value={formState.externalStoreId} onChange={(event) => onChange("externalStoreId", event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>External account ID</span>
          <input value={formState.externalAccountId} onChange={(event) => onChange("externalAccountId", event.target.value)} style={inputStyle} />
        </label>
      </div>

      <div className="operator-responsive-grid-3" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {providerDef.fields.map((field) => (
          <label key={field.key} style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>{field.label}</span>
            <input
              type="password"
              value={formState.credentials[field.key] || ""}
              onChange={(event) => onChange(`credentials.${field.key}`, event.target.value)}
              placeholder={savedAccount?.credentials_last4 ? "Leave blank to keep existing secret" : ""}
              style={inputStyle}
            />
          </label>
        ))}
      </div>

      <div className="operator-responsive-actions" style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <label style={checkLabelStyle}>
          <input type="checkbox" checked={formState.isEnabled} onChange={(event) => onChange("isEnabled", event.target.checked)} />
          Enable this provider for delivery dispatch
        </label>
        <label style={checkLabelStyle}>
          <input type="checkbox" checked={formState.isDefault} onChange={(event) => onChange("isDefault", event.target.checked)} />
          Set as default provider
        </label>
      </div>

      <div className="operator-responsive-card-actions" style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={onSave} disabled={busyKey === provider} style={primaryButtonStyle}>
          {busyKey === provider ? "Saving..." : `Save ${providerDef.label}`}
        </button>
        {savedAccount ? (
          <button type="button" onClick={onDisconnect} disabled={busyKey === `${provider}:disconnect`} style={secondaryDangerButtonStyle}>
            {busyKey === `${provider}:disconnect` ? "Disconnecting..." : "Disconnect provider"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default function OperatorDeliveryPage() {
  const { selectedRestaurant } = useOperator();
  const [state, setState] = useState({ status: "idle", settings: null, error: "", message: "" });
  const [forms, setForms] = useState({});
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    if (!selectedRestaurant?.id) return;

    let cancelled = false;

    async function loadSettings() {
      try {
        setState((prev) => ({ ...prev, status: "loading", error: "", message: "" }));
        const response = await getDeliverySettings(selectedRestaurant.id);
        if (cancelled) return;

        const nextForms = {};
        for (const provider of PROVIDERS) {
          const savedAccount = (response.settings.accounts || []).find((entry) => entry.provider === provider.key);
          nextForms[provider.key] = providerStateFromAccount(savedAccount, provider.key);
        }

        setForms(nextForms);
        setState({ status: "ready", settings: response.settings, error: "", message: "" });
      } catch (error) {
        if (cancelled) return;
        setState({ status: "error", settings: null, error: error.message || "Unable to load delivery settings.", message: "" });
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [selectedRestaurant?.id]);

  const activeProviders = useMemo(
    () => state.settings?.active_delivery_providers || [],
    [state.settings]
  );

  function updateForm(provider, field, value) {
    setForms((prev) => {
      const next = { ...(prev[provider] || providerDefaults(provider)) };
      const nextState = { ...prev };

      if (field.startsWith("credentials.")) {
        const key = field.split(".")[1];
        next.credentials = { ...(next.credentials || {}), [key]: value };
      } else if (field === "isDefault" && value === true) {
        next.isDefault = true;
      } else {
        next[field] = value;
      }

      if (field === "isDefault" && value === true) {
        for (const providerKey of Object.keys(nextState)) {
          if (providerKey !== provider && nextState[providerKey]) {
            nextState[providerKey] = { ...nextState[providerKey], isDefault: false };
          }
        }
      }

      nextState[provider] = next;
      return nextState;
    });
  }

  async function reloadSettings(message = "") {
    if (!selectedRestaurant?.id) return;
    const response = await getDeliverySettings(selectedRestaurant.id);
    const nextForms = {};
    for (const provider of PROVIDERS) {
      const savedAccount = (response.settings.accounts || []).find((entry) => entry.provider === provider.key);
      nextForms[provider.key] = providerStateFromAccount(savedAccount, provider.key);
    }
    setForms(nextForms);
    setState({ status: "ready", settings: response.settings, error: "", message });
  }

  async function handleSaveProvider(provider) {
    if (!selectedRestaurant?.id) return;
    const formState = forms[provider];
    setBusyKey(provider);

    try {
      const credentials = Object.fromEntries(
        Object.entries(formState.credentials || {}).filter(([, value]) => String(value || "").trim())
      );

      await saveDeliveryProviderAccount(selectedRestaurant.id, provider, {
        accountLabel: formState.accountLabel,
        businessName: formState.businessName,
        contactEmail: formState.contactEmail,
        accountStatus: formState.accountStatus,
        isEnabled: formState.isEnabled,
        isDefault: formState.isDefault,
        externalBusinessId: formState.externalBusinessId,
        externalStoreId: formState.externalStoreId,
        externalAccountId: formState.externalAccountId,
        credentials,
      });

      await reloadSettings("Provider settings saved.");
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "Unable to save provider settings.", message: "" }));
    } finally {
      setBusyKey("");
    }
  }

  async function handleDisconnectProvider(provider) {
    if (!selectedRestaurant?.id) return;
    setBusyKey(`${provider}:disconnect`);
    try {
      await disconnectDeliveryProviderAccount(selectedRestaurant.id, provider);
      await reloadSettings("Provider disconnected.");
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "Unable to disconnect provider.", message: "" }));
    } finally {
      setBusyKey("");
    }
  }

  async function handleUpdateSettings(event) {
    event.preventDefault();
    if (!selectedRestaurant?.id || !state.settings) return;

    setBusyKey("settings");

    try {
      await updateDeliverySettings(selectedRestaurant.id, {
        deliveryEnabled: state.settings.delivery_enabled,
        defaultDeliveryProvider: state.settings.default_delivery_provider || "",
      });
      await reloadSettings("Restaurant delivery settings updated.");
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "Unable to update delivery settings.", message: "" }));
    } finally {
      setBusyKey("");
    }
  }

  return (
    <OperatorLayout title="Delivery Accounts">
      {!selectedRestaurant ? (
        <div style={{ color: "#5b6675" }}>Select a restaurant to manage delivery settings.</div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          <section
            style={{
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #e4e9f0",
              padding: "18px 18px 16px",
              boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1720" }}>
              {selectedRestaurant.restaurant_name}
            </div>
            <div style={{ marginTop: 8, color: "#5b6675", lineHeight: 1.6, maxWidth: 760 }}>
              Delivery is restaurant-managed. A restaurant can stay pickup-only, connect Uber Direct, connect DoorDash Drive, or connect both and pick a default dispatch provider.
            </div>

            {state.error ? (
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontWeight: 700 }}>
                {state.error}
              </div>
            ) : null}
            {state.message ? (
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "#dcfce7", color: "#166534", fontWeight: 700 }}>
                {state.message}
              </div>
            ) : null}

            <form onSubmit={handleUpdateSettings} style={{ marginTop: 16, display: "grid", gap: 14 }}>
              <label style={checkLabelStyle}>
                <input
                  type="checkbox"
                  checked={state.settings?.delivery_enabled === true}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      settings: {
                        ...(prev.settings || {}),
                        delivery_enabled: event.target.checked,
                      },
                    }))
                  }
                />
                Enable delivery checkout for this restaurant
              </label>

              <label className="operator-responsive-field" style={{ display: "grid", gap: 6, maxWidth: 320 }}>
                <span style={labelStyle}>Default delivery provider</span>
                <select
                  value={state.settings?.default_delivery_provider || ""}
                  onChange={(event) =>
                    setState((prev) => ({
                      ...prev,
                      settings: {
                        ...(prev.settings || {}),
                        default_delivery_provider: event.target.value || null,
                      },
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select default provider</option>
                  {activeProviders.map((provider) => (
                    <option key={provider} value={provider}>
                      {PROVIDERS.find((entry) => entry.key === provider)?.label || provider}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ fontSize: 13, color: "#667085" }}>
                Active providers: {activeProviders.length ? activeProviders.join(", ") : "none"}
              </div>

              <div className="operator-responsive-card-actions">
                <button type="submit" disabled={busyKey === "settings"} style={primaryButtonStyle}>
                  {busyKey === "settings" ? "Saving..." : "Save restaurant delivery settings"}
                </button>
              </div>
            </form>
          </section>

          {PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.key}
              provider={provider.key}
              savedAccount={(state.settings?.accounts || []).find((entry) => entry.provider === provider.key) || null}
              formState={forms[provider.key] || providerDefaults(provider.key)}
              onChange={(field, value) => updateForm(provider.key, field, value)}
              onSave={() => handleSaveProvider(provider.key)}
              onDisconnect={() => handleDisconnectProvider(provider.key)}
              busyKey={busyKey}
            />
          ))}
        </div>
      )}
    </OperatorLayout>
  );
}

const inputStyle = {
  borderRadius: 12,
  border: "1px solid #d9e0ea",
  background: "#fff",
  padding: "10px 12px",
  fontSize: 14,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const checkLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontWeight: 700,
  color: "#0f1720",
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: 12,
  background: "#1F4E3D",
  color: "#fff",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryDangerButtonStyle = {
  border: "1px solid #fecaca",
  borderRadius: 12,
  background: "#fff5f5",
  color: "#b42318",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};
