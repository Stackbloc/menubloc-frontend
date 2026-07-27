import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  API_BASE,
  acceptOrder,
  confirmDeliveryPickup,
  declineOrder,
  getLiveOrders,
  getOrderAvailability,
  markOrderCompleted,
  markOrderPreparing,
  markOrderReady,
  updateOrderAvailability,
} from "../../lib/operatorApi.js";
import OrderAvailabilityControls from "../../components/operator/OrderAvailabilityControls.jsx";
import "./operatorTablet.css";

const ALERT_VOLUME = 0.65;
const ORDER_POLL_MS = 15000;

function playAlertTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    const first = ctx.createOscillator();
    const second = ctx.createOscillator();

    first.type = "square";
    second.type = "sine";
    first.frequency.setValueAtTime(740, ctx.currentTime);
    first.frequency.setValueAtTime(980, ctx.currentTime + 0.18);
    second.frequency.setValueAtTime(1240, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(ALERT_VOLUME, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    first.connect(gain);
    second.connect(gain);
    gain.connect(ctx.destination);
    first.start(ctx.currentTime);
    second.start(ctx.currentTime + 0.08);
    first.stop(ctx.currentTime + 0.9);
    second.stop(ctx.currentTime + 0.75);
  } catch {
    // Browser audio support is best-effort.
  }
}

function currency(cents, code = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(code || "usd").toUpperCase(),
  }).format(Number(cents || 0) / 100);
}

function timeShort(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(value) {
  return String(value || "").replace(/_/g, " ");
}

function minutesWaiting(value, now) {
  if (!value) return 0;
  return Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
}

function isIncoming(order) {
  return ["paid", "merchant_acceptance_pending"].includes(order?.order_status);
}

function isInProgress(order) {
  return ["accepted", "preparing", "ready"].includes(order?.order_status);
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [beforeInstallPromptReceived, setBeforeInstallPromptReceived] = useState(() => {
    return localStorage.getItem("menuplyOperatorPwa.beforeInstallPromptReceived") === "true";
  });
  const [appInstalledEventFired, setAppInstalledEventFired] = useState(() => {
    return localStorage.getItem("menuplyOperatorPwa.appInstalledEventFired") === "true";
  });
  const [standalone, setStandalone] = useState(false);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  const [relatedApps, setRelatedApps] = useState(null);
  const [relatedAppsError, setRelatedAppsError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const refreshDiagnostics = useCallback(async () => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setStandalone(isStandalone);
    console.info("[Menuply Operator PWA] display-mode standalone:", isStandalone);

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const hasRegistration = !!registration;
        setServiceWorkerRegistered(hasRegistration);
        console.info("[Menuply Operator PWA] service worker registered:", hasRegistration, registration || null);
      } catch (error) {
        setServiceWorkerRegistered(false);
        console.warn("[Menuply Operator PWA] service worker registration check failed:", error);
      }
    } else {
      setServiceWorkerRegistered(false);
      console.info("[Menuply Operator PWA] service workers unavailable in this browser.");
    }

    if (typeof navigator.getInstalledRelatedApps === "function") {
      try {
        const apps = await navigator.getInstalledRelatedApps();
        setRelatedApps(apps);
        setRelatedAppsError("");
        console.info("[Menuply Operator PWA] getInstalledRelatedApps results:", apps);
      } catch (error) {
        setRelatedApps([]);
        setRelatedAppsError(error.message || "Unable to read installed related apps.");
        console.warn("[Menuply Operator PWA] getInstalledRelatedApps failed:", error);
      }
    } else {
      setRelatedApps(null);
      setRelatedAppsError("navigator.getInstalledRelatedApps is not available in this browser.");
      console.info("[Menuply Operator PWA] getInstalledRelatedApps unavailable.");
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      console.info("[Menuply Operator PWA] beforeinstallprompt received:", event);
      event.preventDefault();
      localStorage.setItem("menuplyOperatorPwa.beforeInstallPromptReceived", "true");
      setBeforeInstallPromptReceived(true);
      setPromptEvent(event);
    };
    const handleInstalled = () => {
      console.info("[Menuply Operator PWA] appinstalled event fired.");
      localStorage.setItem("menuplyOperatorPwa.appInstalledEventFired", "true");
      setAppInstalledEventFired(true);
      setPromptEvent(null);
      refreshDiagnostics();
    };

    queueMicrotask(() => {
      refreshDiagnostics();
    });
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [refreshDiagnostics]);

  const install = useCallback(async () => {
    if (!promptEvent) return false;
    console.info("[Menuply Operator PWA] install prompt opened.");
    promptEvent.prompt();
    const result = await promptEvent.userChoice.catch(() => null);
    console.info("[Menuply Operator PWA] install prompt result:", result);
    setPromptEvent(null);
    refreshDiagnostics();
    return result?.outcome === "accepted";
  }, [promptEvent, refreshDiagnostics]);

  const resetPwaState = useCallback(async () => {
    console.warn("[Menuply Operator PWA] Reset PWA State requested.");
    setResetMessage("Resetting PWA state...");
    localStorage.removeItem("menuplyOperatorPwa.beforeInstallPromptReceived");
    localStorage.removeItem("menuplyOperatorPwa.appInstalledEventFired");
    setBeforeInstallPromptReceived(false);
    setAppInstalledEventFired(false);
    setPromptEvent(null);

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
      console.warn("[Menuply Operator PWA] service workers unregistered:", registrations.length);
    }

    if ("caches" in window) {
      const cacheNames = await caches.keys().catch(() => []);
      const pwaCacheNames = cacheNames.filter((cacheName) => cacheName.startsWith("menuply-operator-pwa"));
      await Promise.all(pwaCacheNames.map((cacheName) => caches.delete(cacheName).catch(() => false)));
      console.warn("[Menuply Operator PWA] PWA caches cleared:", pwaCacheNames);
    }

    setResetMessage("PWA state reset. Close Chrome fully, reopen, then revisit /operator/tablet.");
    refreshDiagnostics();
  }, [refreshDiagnostics]);

  return {
    appInstalledEventFired,
    beforeInstallPromptReceived,
    canInstall: !!promptEvent,
    install,
    refreshDiagnostics,
    relatedApps,
    relatedAppsError,
    resetMessage,
    resetPwaState,
    serviceWorkerRegistered,
    standalone,
  };
}

function PrintTicket({ order, restaurantName }) {
  if (!order) return null;
  return (
    <div id="operator-tablet-print-ticket">
      <div className="ot-ticket-center">
        <div className="ot-ticket-brand">MENUPLY</div>
        <div className="ot-ticket-order">ORDER #{order.id}</div>
        <div className="ot-ticket-type">{statusLabel(order.fulfillment_type)}</div>
        <div>{order.restaurant_name || restaurantName}</div>
      </div>
      <div className="ot-ticket-line" />
      <div><strong>Customer:</strong> {order.customer_name || "--"}</div>
      <div><strong>Phone:</strong> {order.customer_phone || "--"}</div>
      <div><strong>Ordered:</strong> {timeShort(order.created_at)}</div>
      <div className="ot-ticket-line" />
      {(order.items || []).map((item, index) => (
        <div key={item.id || index} className="ot-ticket-item">
          <div><strong>{item.quantity} x {item.name_snapshot}</strong></div>
          {item.preparation_instructions || item.special_instructions ? <div>* Prep: {item.preparation_instructions || item.special_instructions}</div> : null}
          <div className="ot-ticket-price">{currency(item.line_total_cents, order.currency)}</div>
        </div>
      ))}
      <div className="ot-ticket-line" />
      <div className="ot-ticket-total">Total: {currency(order.total_cents, order.currency)}</div>
      <div className="ot-ticket-powered">Powered by Menuply</div>
    </div>
  );
}

function InstallPanel({ canInstall, installed, install, standalone }) {
  const [showManualInstall, setShowManualInstall] = useState(false);

  if (installed || standalone) {
    return (
      <div className="ot-install ot-install--installed">
        <span>Installed app view</span>
      </div>
    );
  }

  return (
    <div className="ot-install-wrap">
      {canInstall ? (
        <button type="button" className="ot-install ot-install--button" onClick={install}>
          <strong>Install Menuply Operator</strong>
          <span>Tap to open Chrome install prompt</span>
        </button>
      ) : (
        <button
          type="button"
          className="ot-install ot-install--manual"
          onClick={() => setShowManualInstall((value) => !value)}
        >
          <strong>Install Menuply Operator</strong>
          <span>Chrome menu → Add to Home screen</span>
        </button>
      )}
      {!canInstall && showManualInstall ? (
        <div className="ot-install-instructions">
          <strong>Manual install</strong>
          <span>Open Chrome menu, choose Install app or Add to Home screen, then confirm Menuply Operator.</span>
        </div>
      ) : null}
    </div>
  );
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function PwaStatusPanel({ diagnostics }) {
  const relatedAppsAvailable = Array.isArray(diagnostics.relatedApps);
  return (
    <section className="ot-pwa-status" aria-label="PWA Status">
      <div className="ot-pwa-status__header">
        <div>
          <span>PWA Status</span>
          <strong>Tablet install diagnostics</strong>
        </div>
        <div className="ot-pwa-status__actions">
          <button type="button" className="ot-button ot-button--secondary" onClick={diagnostics.refreshDiagnostics}>
            Refresh PWA Status
          </button>
          <button type="button" className="ot-button ot-button--danger-outline" onClick={diagnostics.resetPwaState}>
            Reset PWA State
          </button>
        </div>
      </div>

      <dl className="ot-pwa-status__grid">
        <div>
          <dt>beforeinstallprompt received</dt>
          <dd>{yesNo(diagnostics.beforeInstallPromptReceived)}</dd>
        </div>
        <div>
          <dt>service worker registered</dt>
          <dd>{yesNo(diagnostics.serviceWorkerRegistered)}</dd>
        </div>
        <div>
          <dt>appinstalled event fired</dt>
          <dd>{yesNo(diagnostics.appInstalledEventFired)}</dd>
        </div>
        <div>
          <dt>display-mode standalone</dt>
          <dd>{yesNo(diagnostics.standalone)}</dd>
        </div>
      </dl>

      <div className="ot-pwa-related">
        <strong>navigator.getInstalledRelatedApps()</strong>
        {relatedAppsAvailable ? (
          diagnostics.relatedApps.length > 0 ? (
            <pre>{JSON.stringify(diagnostics.relatedApps, null, 2)}</pre>
          ) : (
            <p>Available; returned an empty list.</p>
          )
        ) : (
          <p>{diagnostics.relatedAppsError || "Not checked yet."}</p>
        )}
      </div>

      {diagnostics.resetMessage ? (
        <div className="ot-pwa-reset-message">{diagnostics.resetMessage}</div>
      ) : null}
    </section>
  );
}

function OrderItems({ order }) {
  const items = order?.items || [];
  if (items.length === 0) return <div className="ot-muted">No items attached.</div>;

  return (
    <div className="ot-items">
      {items.map((item, index) => (
        <div className="ot-item" key={item.id || index}>
          <div>
            <strong>{item.quantity} x {item.name_snapshot}</strong>
            {Array.isArray(item.modifiers) && item.modifiers.length > 0 ? (
              <span>{item.modifiers.map((modifier) => modifier.name).join(", ")}</span>
            ) : null}
            {item.preparation_instructions || item.special_instructions ? <em>Prep: {item.preparation_instructions || item.special_instructions}</em> : null}
          </div>
          <b>{currency(item.line_total_cents, order.currency)}</b>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, selected, now, onSelect }) {
  const waiting = minutesWaiting(order.created_at, now);
  return (
    <button
      type="button"
      className={`ot-order-card ${selected ? "is-selected" : ""} ${isIncoming(order) ? "is-incoming" : ""}`}
      onClick={() => onSelect(order.id)}
    >
      <span className="ot-order-id">#{order.id}</span>
      <span className="ot-order-customer">{order.customer_name || "Guest"}</span>
      <span className="ot-order-meta">
        {statusLabel(order.fulfillment_type)} · {timeShort(order.created_at)}
      </span>
      <span className="ot-order-bottom">
        <b>{currency(order.total_cents, order.currency)}</b>
        <small>{waiting > 0 ? `${waiting}m` : "new"}</small>
      </span>
    </button>
  );
}

export default function OperatorTabletPage() {
  const navigate = useNavigate();
  const { selectedRestaurant, restaurants, setSelectedRestaurant, logout } = useOperator();
  const restaurantId = selectedRestaurant?.id;
  const restaurantName = selectedRestaurant?.restaurant_name || selectedRestaurant?.name || "Restaurant";
  const isOnline = useOnlineStatus();
  const pwaDiagnostics = useInstallPrompt();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [declineOrderId, setDeclineOrderId] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [printOrder, setPrintOrder] = useState(null);
  const [alertsReady, setAlertsReady] = useState(false);
  const [notificationState, setNotificationState] = useState("default");
  const [now, setNow] = useState(() => Date.now());
  const alertOrderIdsRef = useRef("");
  const printQueuedRef = useRef(false);

  const incomingOrders = useMemo(() => orders.filter(isIncoming), [orders]);
  const pendingOrders = useMemo(() => orders.filter(isInProgress), [orders]);
  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) || incomingOrders[0] || pendingOrders[0] || null;
  }, [incomingOrders, orders, pendingOrders, selectedOrderId]);

  useEffect(() => {
    document.title = "Menuply Operator";
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadLiveOrders = useCallback(async () => {
    if (!restaurantId || !isOnline) return;
    try {
      const data = await getLiveOrders(restaurantId);
      const nextOrders = data.orders || [];
      setOrders(nextOrders);
      setError("");

      const incomingIds = nextOrders.filter(isIncoming).map((order) => order.id).join(",");
      if (incomingIds && incomingIds !== alertOrderIdsRef.current && alertsReady) {
        playAlertTone();
      }
      alertOrderIdsRef.current = incomingIds;
    } catch (err) {
      setError(err.message || "Unable to refresh orders.");
    }
  }, [alertsReady, isOnline, restaurantId]);

  const loadAvailability = useCallback(async () => {
    if (!restaurantId || !isOnline) return;
    try {
      const data = await getOrderAvailability(restaurantId);
      setAvailability(data.availability || null);
    } catch {
      // Keep last-known status visible.
    }
  }, [isOnline, restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    loadLiveOrders();
    loadAvailability();
    const interval = setInterval(loadLiveOrders, ORDER_POLL_MS);
    return () => clearInterval(interval);
  }, [loadAvailability, loadLiveOrders, restaurantId]);

  useEffect(() => {
    if (!restaurantId || !isOnline) {
      setConnection(isOnline ? "disconnected" : "offline");
      return undefined;
    }

    setConnection("connecting");
    const stream = new EventSource(`${API_BASE}/operator/restaurants/${restaurantId}/orders/stream`, {
      withCredentials: true,
    });

    stream.addEventListener("connected", () => {
      setConnection("live");
      loadLiveOrders();
    });
    stream.addEventListener("new_order", () => {
      if (alertsReady) playAlertTone();
      loadLiveOrders();
    });
    stream.addEventListener("order_confirmed", loadLiveOrders);
    stream.addEventListener("order_cancelled", loadLiveOrders);
    stream.addEventListener("order_ready", loadLiveOrders);
    stream.onerror = () => setConnection("reconnecting");

    return () => stream.close();
  }, [alertsReady, isOnline, loadLiveOrders, restaurantId]);

  useEffect(() => {
    if (isOnline) {
      loadLiveOrders();
      loadAvailability();
    }
  }, [isOnline, loadAvailability, loadLiveOrders]);

  useEffect(() => {
    if (!printOrder || printQueuedRef.current) return;
    printQueuedRef.current = true;
    requestAnimationFrame(() => setTimeout(() => window.print(), 150));
  }, [printOrder]);

  const requireOnline = useCallback(() => {
    if (isOnline) return true;
    setError("Connection lost — new orders may not appear until reconnected.");
    return false;
  }, [isOnline]);

  const runOrderAction = useCallback(async (actionKey, action) => {
    if (!requireOnline()) return;
    setBusyAction(actionKey);
    setError("");
    try {
      const result = await action();
      await loadLiveOrders();
      return result;
    } catch (err) {
      setError(err.message || "Order action failed.");
      return null;
    } finally {
      setBusyAction("");
    }
  }, [loadLiveOrders, requireOnline]);

  const handleAccept = async (orderId) => {
    const data = await runOrderAction(`${orderId}:accept`, () => acceptOrder(restaurantId, orderId));
    if (data?.order) {
      printQueuedRef.current = false;
      setPrintOrder(data.order);
    }
  };

  const handleDecline = async () => {
    const orderId = declineOrderId;
    if (!orderId) return;
    const data = await runOrderAction(`${orderId}:decline`, () =>
      declineOrder(restaurantId, orderId, { reason_code: declineReason || undefined })
    );
    if (data) {
      setDeclineOrderId(null);
      setDeclineReason("");
    }
  };

  const handleAvailabilityChange = async (payload) => {
    if (!requireOnline()) return;
    setBusyAction("availability:update");
    setError("");
    try {
      const data = await updateOrderAvailability(restaurantId, payload);
      setAvailability(data.availability || null);
    } catch (err) {
      setError(err.message || "Unable to update store status.");
    } finally {
      setBusyAction("");
    }
  };

  const handlePause = (opts) =>
    handleAvailabilityChange({
      order_acceptance_status: "paused",
      order_acceptance_note: opts.pause_until ? "Paused until selected time" : `Paused for ${opts.pause_minutes} minutes`,
      ...opts,
    });

  const handleCloseStore = (opts) =>
    handleAvailabilityChange({
      order_acceptance_status: "closed",
      order_acceptance_note: opts.close_preset || opts.closed_until || opts.close_minutes
        ? "Temporarily closed"
        : "Temporarily closed",
      ...opts,
    });

  const handleResume = () =>
    handleAvailabilityChange({ order_acceptance_status: "accepting_orders" });

  const activateAlerts = () => {
    playAlertTone();
    setAlertsReady(true);
  };

  const prepareFutureNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationState("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationState(result);
  };

  const orderBusy = selectedOrder ? busyAction.startsWith(`${selectedOrder.id}:`) : false;
  const offlineWarning = !isOnline;

  return (
    <main className="operator-tablet">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #operator-tablet-print-ticket, #operator-tablet-print-ticket * { visibility: visible !important; }
          #operator-tablet-print-ticket {
            display: block !important;
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: #fff !important;
          }
          @page { margin: 0.5cm; }
        }
      `}</style>
      <PrintTicket order={printOrder} restaurantName={restaurantName} />

      <header className="ot-header">
        <div>
          <div className="ot-kicker">Menuply Operator</div>
          <h1>{restaurantName}</h1>
          <div className="ot-header-meta">
            <span className={`ot-connection is-${connection}`}>{connection === "live" ? "Live" : statusLabel(connection)}</span>
            <span>{incomingOrders.length} new</span>
            <span>{pendingOrders.length} pending</span>
          </div>
        </div>
        <div className="ot-header-actions">
          {restaurants.length > 1 ? (
            <select
              value={restaurantId || ""}
              onChange={(event) => {
                const next = restaurants.find((restaurant) => String(restaurant.id) === event.target.value);
                if (next) setSelectedRestaurant(next);
              }}
              className="ot-restaurant-select"
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.restaurant_name || restaurant.name || `Restaurant ${restaurant.id}`}
                </option>
              ))}
            </select>
          ) : null}
          <InstallPanel
            canInstall={pwaDiagnostics.canInstall}
            installed={pwaDiagnostics.appInstalledEventFired}
            install={pwaDiagnostics.install}
            standalone={pwaDiagnostics.standalone}
          />
          <button type="button" className="ot-button ot-button--secondary" onClick={() => navigate("/operator/orders")}>
            Desktop Orders
          </button>
          <button type="button" className="ot-button ot-button--ghost" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      {offlineWarning ? (
        <div className="ot-offline" role="alert">
          Connection lost — new orders may not appear until reconnected.
        </div>
      ) : null}
      {error ? <div className="ot-error" role="alert">{error}</div> : null}
      <PwaStatusPanel diagnostics={pwaDiagnostics} />

      {!selectedRestaurant ? (
        <section className="ot-empty">
          <h2>No restaurant selected</h2>
          <p>Select or claim a restaurant in the standard operator portal first.</p>
          <button type="button" className="ot-button ot-button--primary" onClick={() => navigate("/operator/claim")}>
            Open Claims
          </button>
        </section>
      ) : (
        <>
          <section className={`ot-alert-band ${incomingOrders.length > 0 ? "is-active" : ""}`}>
            <div>
              <span>{incomingOrders.length > 0 ? "New Order Alert" : "Ready for Orders"}</span>
              <strong>{incomingOrders.length > 0 ? `${incomingOrders.length} order${incomingOrders.length === 1 ? "" : "s"} need action` : "No new orders waiting"}</strong>
            </div>
            <div className="ot-alert-actions">
              {!alertsReady ? (
                <button type="button" className="ot-button ot-button--alert" onClick={activateAlerts}>
                  Activate Audio Alerts
                </button>
              ) : (
                <span className="ot-alert-ready">Audio alerts on</span>
              )}
              <button type="button" className="ot-button ot-button--secondary" onClick={loadLiveOrders} disabled={!isOnline}>
                Refresh
              </button>
            </div>
          </section>

          <section className="ot-status-panel" style={{ display: "block", padding: 0, background: "transparent", border: "none" }}>
            <OrderAvailabilityControls
              availability={availability}
              busy={busyAction.startsWith("availability:") || !isOnline}
              onPause={handlePause}
              onCloseStore={handleCloseStore}
              onResume={handleResume}
              navigate={navigate}
              compact
            />
          </section>

          <section className="ot-grid">
            <aside className="ot-queue" aria-label="Pending orders queue">
              <div className="ot-section-title">
                <h2>Pending Orders Queue</h2>
                <span>{orders.length}</span>
              </div>
              <div className="ot-queue-list">
                {[...incomingOrders, ...pendingOrders].length === 0 ? (
                  <div className="ot-queue-empty">No active orders.</div>
                ) : (
                  [...incomingOrders, ...pendingOrders].map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      now={now}
                      selected={selectedOrder?.id === order.id}
                      onSelect={setSelectedOrderId}
                    />
                  ))
                )}
              </div>
            </aside>

            <section className="ot-detail" aria-label="Selected order">
              {!selectedOrder ? (
                <div className="ot-detail-empty">
                  <h2>Waiting for the next order</h2>
                  <p>Keep this screen open on the tablet. New orders will appear in the queue.</p>
                </div>
              ) : (
                <>
                  <div className="ot-detail-header">
                    <div>
                      <span>Order #{selectedOrder.id}</span>
                      <h2>{selectedOrder.customer_name || "Guest"}</h2>
                      <p>{selectedOrder.customer_phone || "No phone"} · {statusLabel(selectedOrder.fulfillment_type)} · {timeShort(selectedOrder.created_at)}</p>
                    </div>
                    <div className="ot-total">{currency(selectedOrder.total_cents, selectedOrder.currency)}</div>
                  </div>

                  <div className="ot-badges">
                    <span>{statusLabel(selectedOrder.order_status)}</span>
                    <span>{minutesWaiting(selectedOrder.created_at, now)} min waiting</span>
                    {selectedOrder.fulfillment_type === "delivery" ? <span>Delivery</span> : <span>Pickup</span>}
                  </div>

                  <OrderItems order={selectedOrder} />

                  {selectedOrder.notes ? (
                    <div className="ot-note">
                      <strong>Customer instructions</strong>
                      <span>{selectedOrder.notes}</span>
                    </div>
                  ) : null}

                  <div className="ot-actions">
                    {isIncoming(selectedOrder) ? (
                      <>
                        <button
                          type="button"
                          className="ot-action ot-action--accept"
                          disabled={orderBusy || !isOnline}
                          onClick={() => handleAccept(selectedOrder.id)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="ot-action ot-action--decline"
                          disabled={orderBusy || !isOnline}
                          onClick={() => setDeclineOrderId(selectedOrder.id)}
                        >
                          Decline
                        </button>
                      </>
                    ) : null}
                    {selectedOrder.order_status === "accepted" ? (
                      <button
                        type="button"
                        className="ot-action ot-action--primary"
                        disabled={orderBusy || !isOnline}
                        onClick={() => runOrderAction(`${selectedOrder.id}:prepare`, () => markOrderPreparing(restaurantId, selectedOrder.id))}
                      >
                        Start Prep
                      </button>
                    ) : null}
                    {selectedOrder.order_status === "preparing" ? (
                      <button
                        type="button"
                        className="ot-action ot-action--primary"
                        disabled={orderBusy || !isOnline}
                        onClick={() => runOrderAction(`${selectedOrder.id}:ready`, () => markOrderReady(restaurantId, selectedOrder.id))}
                      >
                        Mark Ready
                      </button>
                    ) : null}
                    {selectedOrder.order_status === "ready" && selectedOrder.fulfillment_type === "delivery" && selectedOrder.delivery_status !== "picked_up" ? (
                      <button
                        type="button"
                        className="ot-action ot-action--primary"
                        disabled={orderBusy || !isOnline}
                        onClick={() => runOrderAction(`${selectedOrder.id}:picked-up`, () => confirmDeliveryPickup(restaurantId, selectedOrder.id))}
                      >
                        Picked Up
                      </button>
                    ) : null}
                    {selectedOrder.order_status === "ready" ? (
                      <button
                        type="button"
                        className="ot-action ot-action--complete"
                        disabled={orderBusy || !isOnline}
                        onClick={() => runOrderAction(`${selectedOrder.id}:complete`, () => markOrderCompleted(restaurantId, selectedOrder.id))}
                      >
                        Complete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="ot-action ot-action--print"
                      onClick={() => {
                        printQueuedRef.current = false;
                        setPrintOrder(selectedOrder);
                      }}
                    >
                      Print
                    </button>
                  </div>
                </>
              )}
            </section>
          </section>

          <section className="ot-push-foundation">
            <div>
              <strong>Push notification foundation</strong>
              <span>Screen and audio alerts are active first. Push can be connected later without changing tablet workflow.</span>
            </div>
            <button type="button" className="ot-button ot-button--secondary" onClick={prepareFutureNotifications}>
              Check Notification Permission
            </button>
            <span>{notificationState}</span>
          </section>
        </>
      )}

      {declineOrderId ? (
        <div className="ot-modal" role="dialog" aria-modal="true">
          <div className="ot-modal-panel">
            <h2>Decline Order #{declineOrderId}?</h2>
            <p>This rejects the order. Refund handling starts on the backend when required.</p>
            <select value={declineReason} onChange={(event) => setDeclineReason(event.target.value)}>
              <option value="">Select reason</option>
              <option value="too_busy">Too busy</option>
              <option value="kitchen_backlog">Kitchen backlog</option>
              <option value="sold_out">Item sold out</option>
              <option value="closing_early">Closing early</option>
              <option value="other">Other</option>
            </select>
            <div className="ot-modal-actions">
              <button type="button" className="ot-action ot-action--decline" disabled={!!busyAction || !isOnline} onClick={handleDecline}>
                Decline
              </button>
              <button type="button" className="ot-action ot-action--print" disabled={!!busyAction} onClick={() => setDeclineOrderId(null)}>
                Keep Order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
