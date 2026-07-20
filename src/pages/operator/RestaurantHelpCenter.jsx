import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import {
  createTicket,
  getHelpKnownIssues,
  getTickets,
} from "../../lib/operatorApi.js";
import {
  answerKnowledgeBase,
  logKnowledgeBaseArticleClick,
  logKnowledgeBaseEscalation,
  submitKnowledgeBaseFeedback,
} from "../../lib/knowledgeBaseApi.js";

const cardStyle = {
  background: "#fff",
  border: "1px solid #e4e9f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 14px 36px rgba(15, 23, 32, 0.04)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d7deea",
  borderRadius: 12,
  padding: "13px 14px",
  fontSize: 15,
  fontFamily: "inherit",
  color: "#0f1720",
  background: "#fff",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
};

const feedbackButtonStyle = {
  border: "1px solid #d7deea",
  borderRadius: 999,
  background: "#fff",
  color: "#475467",
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const TICKET_CATEGORIES = [
  "Orders & Delivery",
  "Hardware & Setup",
  "Menu & Customer Tools",
  "Staff & Access",
  "Troubleshooting",
  "Account & Billing",
];

/** When you edit OPERATIONS_SECTIONS copy, bump this date (YYYY-MM-DD). Shown on article views. */
const HELP_CONTENT_UPDATED = "2026-07-19";

const OPERATIONS_SECTIONS = [
  {
    id: "portal-overview",
    title: "Operator Portal Overview",
    articles: [
      {
        id: "overview-home",
        title: "Home Screen",
        summary: "Live operational dashboard for the current shift.",
        points: [
          "Displays the live clock (updates every second) and today's date alongside the restaurant name and city — confirming which location is active at a glance.",
          "Store status banner reflects one of three states: Accepting Orders (green), Orders Paused (amber), or Closed (red). The banner color and label update immediately when status changes.",
          "Use the Pause Ordering dropdown to pause for 30 min, 1 hr, 3 hrs, or a custom number of minutes. The pause note is recorded and visible to the operations team.",
          "Stats row shows Orders Today, Pending orders currently awaiting action, and Cancelled orders today. These are pulled live from the order queue.",
          "Sales card shows Today, Yesterday, Week-to-Date (Sunday–Saturday), and Month-to-Date totals. Only completed, confirmed, preparing, and ready orders are counted — cancelled and declined orders are excluded.",
          "An active alerts banner appears when orders are pending confirmation — click it to jump directly to the Orders screen's Pending tab.",
          "Quick Access buttons navigate to Public Profile, Menu Lab, and Deals without returning to the sidebar.",
          "Dashboard data auto-refreshes every 60 seconds. The clock is always live.",
        ],
      },
      {
        id: "overview-orders",
        title: "Orders Screen",
        summary: "Real-time order management for incoming, in-progress, and past orders.",
        points: [
          "Order Status Panel at the top has three lights: Accepting Orders (green), Pause Orders (amber), Stop Orders (red). The lit indicator shows the current state. Click any unlit button to change status — Pause and Stop show a confirmation dialog before committing.",
          "When a new order arrives, a flashing red NEW ORDER banner appears and an alert beep sounds (once audio is activated). Each order card shows customer name, phone, items, totals, fulfillment type, and elapsed time.",
          "Accept an order to confirm it and trigger an automatic print ticket. Decline opens a reason dialog; the customer's payment is refunded immediately on decline.",
          "Order progression: Accept → Start Preparing → Mark Ready → Mark Completed. For delivery orders, a Confirm Picked Up step is added before completion.",
          "Tabs: Pending Orders (accepted/preparing/ready in the current queue), Completed Orders (last 2 days), Cancelled Orders (last 2 days), Past Orders (up to 21 days with status, type, and date range filters).",
          "The connection indicator in the top bar shows live stream status (Live / Connecting / Reconnecting). If connection drops, a warning banner appears — orders continue to be polled every 15 seconds automatically.",
          "Alert volume can be set to Low, Med, High, or Max. Activate audio once per session with the Activate Alerts button, then adjust the level with the volume selector.",
        ],
      },
      {
        id: "overview-menu-editor",
        title: "Menu Lab",
        summary: "Create and manage all menus and menu items for the restaurant.",
        points: [
          "Overview mode lists all menus. From here, create a new menu with Add via Upload (PDF or image) or select a menu and click Edit to enter full edit mode.",
          "Edit mode focuses on one menu. The header shows the menu name and provides a ← Menus back link and a Done button. All changes are saved in real time.",
          "Within a menu, items are grouped into sections. Use + Add Item to add a new item. Items can have a name, price, description, modifiers, dietary flags (vegan, gluten-free, etc.), and an optional photo (Pro plan — camera control on each item row).",
          "Menu Lab Design controls layout, colors, hero image, and Image density (Thumbnail or All required for dish photos to appear on the public menu). Preview my menu opens design-edit mode to replace stock or hero photos.",
          "Multiple menus are supported — a breakfast menu, lunch menu, late-night menu, and more can all coexist. Scheduled display settings control which menu is active during which hours.",
          "Menus marked as published are visible on the public profile. Unpublished menus are visible only inside the editor.",
        ],
      },
      {
        id: "overview-deals",
        title: "Deals",
        summary: "Create time-limited offers that appear on your public profile and in search.",
        points: [
          "Deals are customer-visible offers attached to your Menuply restaurant profile. They appear in search results and on your public profile page.",
          "Each deal has a headline, description, optional discount amount or type, and an active date range. Expired deals are automatically hidden from the public profile.",
          "Active deals signal promotions to customers who follow your profile and to new customers discovering you in search.",
          "Only create deals the kitchen can reliably fulfill during the active period. A deal visible on the profile creates a customer expectation.",
        ],
      },
      {
        id: "overview-my-account",
        title: "My Account",
        summary: "Subscription status and plan details for this restaurant location.",
        points: [
          "Shows the active plan name (Starter, Pro Monthly, Pro Annual, or Founders), current status (Active, Trialing, Past Due), billing interval, next renewal date, and whether auto-renew is on.",
          "Use Change Plan to navigate to the full plan picker. Use Cancel Subscription to end the plan at the current billing period end — the Cancel button only appears for active paid subscriptions not already set to cancel.",
          "Subscription changes apply immediately on upgrade. Cancellations keep benefits active until the period end date shown.",
        ],
      },
      {
        id: "overview-qr-tools",
        title: "QR Tools",
        summary: "See, share, and print your digital menu QR, or order physical stickers and decals from Marketplace.",
        points: [
          "My Account → My QR Code shows your primary digital menu QR — share the link, print a copy, or download PNG/SVG/PDF.",
          "Marketplace (Owner / Business sidebar) opens QR merchandise ordering for stickers, window decals, and table kits.",
          "Orders are placed through the portal with a Stripe payment. Fulfillment begins only after payment is confirmed — no partial fulfillment.",
          "Best placements: table tents, counter standees, takeout bags, and receipt inserts. The QR code links to your current public menu — no reprinting needed when you update items.",
        ],
      },
      {
        id: "overview-subscription-page",
        title: "Subscription & Plan Selection",
        summary: "Full plan comparison and upgrade flow — accessible to account owners.",
        points: [
          "Accessible from My Account → Change Plan, or from the Subscription item in the Business sidebar section (requires Owner PIN).",
          "Shows the full feature comparison matrix across Starter (free), Pro Monthly, Pro Annual, and Founders plans.",
          "Pro plans unlock advanced menu tools, unlimited menus, deal posting, billboard ads, and marketplace ordering. Founders plan is the best per-year value and has limited availability.",
          "The QR kit add-on callout appears above the feature table — order directly from the subscription screen.",
        ],
      },
    ],
  },
  {
    id: "sidebar-navigation",
    title: "Sidebar Navigation Reference",
    articles: [
      {
        id: "nav-operations",
        title: "Operations Section",
        summary: "Core operational controls available to all logged-in staff.",
        points: [
          "Home — the live operational dashboard. Default landing screen. Shows store status, sales, order counts, and quick access.",
          "Orders — real-time order queue with the status panel, incoming order acceptance, and order history tabs.",
          "Menu — menu editor for all restaurant menus and items.",
          "Deals — create and manage public-facing customer offers.",
          "Billboards — profile splash graphics (graphic-first or linked from Deals). Replaces the old Display Board nav label.",
          "Hours — set weekly operating hours and holiday exceptions.",
        ],
      },
      {
        id: "nav-business",
        title: "Business Section",
        summary: "Owner-level settings protected by Owner PIN.",
        points: [
          "My Account — Profile, Menu, Settings (plan/billing), My QR Code, Delivery Portal (Uber Direct / DoorDash Drive), and Password. No PIN required.",
          "Marketplace — order printed QR stickers, window decals, and table kits at /operator/qr-kits/order.",
          "Billboards — manage profile splash creatives at /operator/billboards.",
          "Restaurant Profile / Owner PIN Settings — edit public-facing restaurant info (owner PIN for sensitive settings).",
          "Business section items are intentionally separated from daily operations so staff cannot accidentally change billing or profile details.",
        ],
      },
      {
        id: "nav-support",
        title: "Support Section",
        summary: "Account information and help resources.",
        points: [
          "My Account — profile, menu, plan/billing Settings, My QR Code, Delivery Portal, and password. No PIN required.",
          "Knowledge Base — setup guides, troubleshooting, hardware recommendations, and direct support ticket submission.",
          "Support items are visible to all portal users. No elevated access required.",
        ],
      },
      {
        id: "nav-restaurant-switcher",
        title: "Switching Restaurants",
        summary: "Operators managing multiple locations can switch context from the sidebar.",
        points: [
          "The restaurant selector at the top of the sidebar shows the currently active location.",
          "All dashboard data, orders, menus, and settings shown in the portal reflect the selected restaurant.",
          "Switching restaurants immediately reloads all portal data for the new location — no page refresh needed.",
          "Each restaurant has its own independent subscription, menu, and order history.",
        ],
      },
    ],
  },
  {
    id: "dashboard-analytics",
    title: "Dashboard & Sales Data",
    articles: [
      {
        id: "reading-sales",
        title: "Understanding Your Sales Totals",
        summary: "How the Home screen sales figures are calculated.",
        points: [
          "Today — sum of all completed, confirmed, preparing, and ready orders placed since midnight local time.",
          "Yesterday — same status filter applied to orders placed between yesterday midnight and today midnight.",
          "Week to Date (WTD) — orders from the start of the current week (Sunday midnight) through now.",
          "Month to Date (MTD) — orders from the first day of the current calendar month through now.",
          "Cancelled and declined orders are excluded from all sales totals. Only orders with a forward-moving status count.",
          "Totals are computed from subtotal amounts. Tax and delivery fees are not included in the sales figures shown on the dashboard.",
        ],
      },
      {
        id: "order-status-definitions",
        title: "Order Status Definitions",
        summary: "What each order status means in the Menuply system.",
        points: [
          "Pending / Awaiting Acceptance — customer has paid; restaurant must Accept or Decline. Time-sensitive: the elapsed badge turns amber at 5 minutes and red at 10 minutes.",
          "Accepted — restaurant confirmed the order. Kitchen has been notified. Print ticket is generated at this step.",
          "Preparing — kitchen has started the order. Customer is informed the food is being made.",
          "Ready — order is complete and waiting for pickup or courier collection.",
          "Completed — order has been picked up or delivered. This is the final positive status.",
          "Cancelled / Declined — restaurant declined, or the order was cancelled. Payment is refunded automatically on decline.",
          "Refunded — a refund was issued. This may appear on legacy or manually-refunded orders.",
        ],
      },
      {
        id: "store-status-guide",
        title: "Store Status: When to Use Each Setting",
        summary: "Guidance on choosing between Accepting, Paused, and Closed.",
        points: [
          "Accepting Orders — the default operational state. Customers can place new orders in real time.",
          "Pause Orders — use when the kitchen is temporarily overwhelmed or short-staffed. Customers see a 'Temporarily Unavailable' message but can still browse the menu. Existing accepted orders continue normally.",
          "Stop Orders — use when closing early or for an extended stoppage. Stronger signal than Pause. Also use the Hours settings to reflect any permanent schedule changes.",
          "Pause has a built-in duration on the Home screen (30 min, 1 hr, 3 hrs, or custom). The Orders screen allows a free-form pause without a timer.",
          "Status changes are immediate and visible to customers in real time. Resume Orders from the Orders screen status panel or from the Home screen resume button.",
        ],
      },
      {
        id: "pending-orders-priority",
        title: "Pending Orders and Response Time",
        summary: "Why fast response to incoming orders matters operationally.",
        points: [
          "The elapsed time badge on an incoming order turns amber at 5 minutes and red at 10 minutes — these are signals that the customer is waiting with an active order.",
          "A repeating alert beep fires every 30 seconds while unconfirmed orders exist, as long as audio is activated.",
          "Slow acceptance increases cancellation rates and customer dissatisfaction. Target acceptance within 2–3 minutes of order placement.",
          "If the kitchen cannot fulfill an order, decline it promptly with a reason code so the customer's payment is refunded immediately.",
        ],
      },
    ],
  },
  {
    id: "customer-facing",
    title: "What Customers See",
    articles: [
      {
        id: "public-profile-overview",
        title: "Your Public Restaurant Profile",
        summary: "What customers see when they find your restaurant on Menuply.",
        points: [
          "The public profile shows your restaurant name, logo, banner photo, about us description, cuisine tags, city/state, hours, and featured dish.",
          "Active deals appear on the profile page with their headline and description.",
          "Customers can follow your restaurant to receive updates when you post deals or make changes.",
          "The public profile URL is /restaurants/[your-restaurant-slug]. Use the Public Profile quick-access button from the Home screen to open it. If you own the listing, you can edit and save profile fields on that page.",
        ],
      },
      {
        id: "public-menu-overview",
        title: "Your Public Menu",
        summary: "What the ordering menu looks like to customers.",
        points: [
          "The public menu is the customer-facing version of your active Menuply menu. It shows item names, descriptions, prices, photos, and dietary tags.",
          "If multiple menus are published and scheduled, the menu that matches the current day and time is shown by default.",
          "Customers can add items to a cart and place an order directly from the public menu. Payment is processed through Stripe.",
          "The public menu URL is /restaurants/[id]/menu. Use the View Public Menu link from the My Account screen or the Public Profile quick-access button to preview it.",
          "Menu updates made in the editor take effect immediately — no separate publish step is needed after saving.",
        ],
      },
      {
        id: "discovery-and-search",
        title: "How Customers Find You",
        summary: "How your restaurant appears in Menuply search and browse results.",
        points: [
          "Customers search by food type, cuisine, dish name, or dietary preference. Your restaurant appears in results when your menu items or profile match the query.",
          "Location matters: results are filtered by city and state, or by the customer's detected location. Accurate address data in your profile ensures you appear in the right market.",
          "Starter and Pro restaurants receive a fully searchable listing. Pro plans add billboard display in search results for additional visibility.",
          "Active deals and dietary tags (vegan, gluten-free, etc.) increase the chance of appearing in filtered searches.",
        ],
      },
      {
        id: "follower-notifications",
        title: "Followers & Restaurant Updates",
        summary: "How the follower system works for customer retention.",
        points: [
          "Customers can follow your restaurant from your public profile page. Followers receive notifications when you post new deals.",
          "The follow feature is available on Starter and Pro plans.",
          "Follower count is visible on your public profile. Growing followers creates a direct channel to your repeat customers without requiring third-party marketing tools.",
          "Post deals proactively before peak periods to engage your follower base before they decide where to order.",
        ],
      },
    ],
  },
  {
    id: "getting-started",
    title: "Getting Started",
    articles: [
      {
        id: "first-order-walkthrough",
        title: "First Order Walkthrough",
        summary: "What staff should expect when the first live order arrives.",
        points: [
          "Keep the incoming orders screen visible during service so the first alert is obvious.",
          "Assign one shift role to own the first confirm action so nobody assumes someone else handled it.",
          "Run one practice order before a rush so staff recognize the alert and the status flow.",
        ],
      },
      {
        id: "tablet-setup",
        title: "Tablet Setup",
        summary: "Set up the operations tablet for stable all-shift use.",
        points: [
          "Use a dedicated restaurant operations tablet instead of a personal device.",
          "Landscape orientation is preferred because it is faster to scan during service.",
          "Keep the device powered and mounted where staff can see it continuously.",
        ],
      },
      {
        id: "printer-setup",
        title: "Printer Setup",
        summary: "Start with recommended hardware and a repeatable setup path.",
        points: [
          "Use Recommended Hardware first when reliability matters more than experimentation.",
          "Keep printer terminology printer-agnostic: print provider, printer connection, and printer status.",
          "Test printing at the exact work station where the printer will stay during service.",
        ],
      },
      {
        id: "wifi-recommendations",
        title: "Wi-Fi Recommendations",
        summary: "Stable connectivity matters more than theoretical speed.",
        points: [
          "Use the strongest operations network available, not weak guest Wi-Fi.",
          "Check signal at the actual tablet mount location, not only at the host stand.",
          "Keep reconnect behavior predictable after overnight resets or power cycles.",
        ],
      },
      {
        id: "order-alert-setup",
        title: "Order Alert Setup",
        summary: "Make sure the team can hear and react to new orders quickly.",
        points: [
          "Test volume during realistic restaurant noise, not only in quiet setup conditions.",
          "Keep the speaker unobstructed and pointed toward the working team.",
          "Use a dedicated operations screen so silent mode or background app behavior does not suppress alerts.",
        ],
      },
    ],
  },
  {
    id: "orders-delivery",
    title: "Orders & Delivery",
    articles: [
      {
        id: "receiving-orders",
        title: "Receiving Orders",
        summary: "Keep order intake visible and predictable during service.",
        points: [
          "Treat the orders screen like an operational console, not a page people hunt for.",
          "Keep one person accountable for first response during each shift.",
          "If multiple screens are added later, validate one clean primary workflow first.",
        ],
      },
      {
        id: "confirming-orders",
        title: "Confirming Orders",
        summary: "Confirm promptly so the customer and kitchen workflow stay aligned.",
        points: [
          "Review the order and confirm it quickly once the restaurant is ready to fulfill it.",
          "Do not allow alert fatigue to turn confirms into delayed manual cleanup.",
          "Use practice orders during training so the confirm step becomes routine.",
        ],
      },
      {
        id: "cancelling-orders",
        title: "Cancelling Orders",
        summary: "Use cancellation deliberately and document repeated causes.",
        points: [
          "Cancel only when the restaurant cannot fulfill the order reliably.",
          "Use a clear operational reason so the team can explain what happened later.",
          "If cancellations repeat, review staffing, item availability, or alert workflow.",
        ],
      },
      {
        id: "delivery-portal-setup",
        title: "Delivery Portal (Uber Direct & DoorDash Drive)",
        summary: "Sign up for delivery services, then link those accounts to Menuply.",
        points: [
          "Open My Account → Delivery Portal.",
          "Use Open Uber Direct signup or Open DoorDash Developer Portal to create your delivery-service account.",
          "After you have signed up, choose Link Delivery Account and enter the IDs/credentials from that provider’s dashboard.",
          "Finish-setup links still open /operator/delivery, which shows the same Delivery Portal.",
        ],
      },
      {
        id: "delivery-pickup-confirmation",
        title: "Delivery Pickup Confirmation",
        summary: "Close the loop when the handoff really happens.",
        points: [
          "Confirm pickup at handoff, not too early.",
          "Keep the device visible to the handoff station or expo.",
          "Make sure shift staff know who owns final pickup confirmation.",
        ],
      },
      {
        id: "order-status-workflow",
        title: "Order Status Workflow",
        summary: "Use a consistent sequence instead of ad hoc status changes.",
        points: [
          "Align the team on what new, confirmed, ready, and picked up actually mean.",
          "Use status changes as part of service rhythm, not as late admin cleanup.",
          "Practice the workflow before a busy shift so the screen feels familiar.",
        ],
      },
      {
        id: "order-alerts-volume",
        title: "Order Alerts and Volume",
        summary: "Balance audibility with restaurant noise and screen placement.",
        points: [
          "Set the volume high enough to cut through rush noise without becoming constant background.",
          "Re-test after moving the device because placement changes alert clarity.",
          "If alerts are inconsistent, review device focus settings and speaker orientation first.",
        ],
      },
    ],
  },
  {
    id: "hardware-setup",
    title: "Hardware & Setup",
    articles: [
      {
        id: "recommended-tablet",
        title: "Recommended Tablet: Lenovo Tab K11",
        summary: "Standard tablet recommendation for Menuply restaurant operations.",
        points: [
          "Menuply recommends the Lenovo Tab K11 as the standard tablet for operations use.",
          "Use it in landscape orientation for better visibility and larger touch targets during service.",
          "Other hardware may work, but Menuply recommends tested hardware to simplify setup and improve operational reliability.",
        ],
      },
      {
        id: "recommended-printer",
        title: "Recommended Printer: Epson TM-T88VI",
        summary: "Standard printer recommendation for the current setup path.",
        points: [
          "Menuply recommends the Epson TM-T88VI as the standard printer path.",
          "It supports Bluetooth now and leaves room for Ethernet later.",
          "Menuply does not imply every printer behaves the same way or supports the same flow.",
        ],
      },
      {
        id: "printer-connection-pairing",
        title: "Printer Connection Pairing",
        summary: "Pair and test the printer connection with a repeatable setup path.",
        points: [
          "Use printer-agnostic language in operations planning: print provider, printer connection, and printer status.",
          "Pair and test in the exact area where the printer will stay during service.",
          "If the first connection path is unreliable, document it before expanding to more devices.",
        ],
      },
      {
        id: "counter-stand-mount-setup",
        title: "Counter Stand / Mount Setup",
        summary: "The mount matters because visibility drives response time.",
        points: [
          "Place the tablet where staff can scan incoming orders without leaving the workflow.",
          "Use a stable stand or mount that keeps the screen readable in landscape.",
          "Protect charging and printer cables from strain, spills, and foot traffic.",
        ],
      },
      {
        id: "kiosk-mode",
        title: "Kiosk Mode / Always-On Order Screen",
        summary: "The long-term goal is a persistent operational screen.",
        points: [
          "Menuply should feel like an operations surface, not a generic SaaS help desk.",
          "Future fullscreen mode should minimize accidental navigation away from orders.",
          "The layout should support future modules like Kitchen Display Mode, Shift Mode, and Multi-Printer Routing.",
        ],
      },
      {
        id: "printer-test-ticket",
        title: "Printer Test Ticket",
        summary: "Run a repeatable print test before live service.",
        points: [
          "Use a test print after pairing, reconnecting, or repositioning the printer.",
          "Validate output timing and readability at the actual work station.",
          "If the print fails, move to the printer troubleshooting article before opening a support ticket.",
        ],
      },
    ],
  },
  {
    id: "staff-access",
    title: "Staff & Access",
    articles: [
      {
        id: "owner-pin",
        title: "Owner PIN",
        summary: "Reserve sensitive settings for deliberate owner access.",
        points: [
          "Owner PIN protects business settings, not normal order handling.",
          "The Knowledge Base itself should remain available without an Owner PIN prompt.",
          "Train the team on which tasks require elevated access and which do not.",
        ],
      },
      {
        id: "staff-permissions",
        title: "Staff Permissions",
        summary: "Keep routine work simple and role-appropriate.",
        points: [
          "Staff should have what they need for orders and routine operations.",
          "Avoid sharing higher-sensitivity controls unless the role requires them.",
          "If a workflow is blocked by permissions, document the exact task before escalating support.",
        ],
      },
      {
        id: "manager-access",
        title: "Manager Access",
        summary: "Managers usually need broader operational visibility.",
        points: [
          "Manager access should support oversight of service workflow, orders, and common fixes.",
          "Define who owns shift-level decisions on the device.",
          "Avoid improvised shared credentials when role-based access is enough.",
        ],
      },
      {
        id: "protecting-owner-settings",
        title: "Protecting Owner Business Settings",
        summary: "Separate operational speed from business control.",
        points: [
          "Keep protected business settings behind deliberate access controls.",
          "Do not let shared counter use drift into unrestricted business configuration access.",
          "Use the Owner PIN model to preserve that boundary.",
        ],
      },
    ],
  },
  {
    id: "menu-customer-tools",
    title: "Menu & Customer Tools",
    articles: [
      {
        id: "photos-and-logos",
        title: "Photos & Logos",
        summary: "Where to upload logos, banners, dish photos, heroes, and deal images — plus file types and size limits.",
        updated: "2026-07-19",
        points: [
          "Restaurant logo — Restaurant Profile → Logo. JPG, JPEG, PNG, WEBP, or SVG up to 5 MB. Square; 512×512 px minimum recommended. Requires Starter plan or higher.",
          "Profile banner — Restaurant Profile → Banner photo. JPG, PNG, or WEBP up to 8 MB. Wide landscape images work best.",
          "Menu hero — Menu Lab → Design → Hero image, or Replace in Preview my menu. JPG, PNG, or WEBP up to 5 MB.",
          "Dish photos — Menu Lab → Edit → camera on item row. JPG, JPEG, PNG, or WEBP up to 10 MB. Pro plan required. HEIC/iPhone photos are not supported — save as JPEG first.",
          "Public menu must show dish photos — Menu Lab Design → set Image density to Thumbnail or All (not None).",
          "Menu scan (PDF/photo of printed menu) — Add via Upload only. Builds menu text; does not attach dish photos to items. Up to 20 MB.",
          "Deal billboard image — Deals or Billboards editor. JPG, PNG, or WEBP up to 5 MB.",
          "Search the Knowledge Base for \"How do I upload photos and logos?\" for the full reference table and troubleshooting.",
        ],
      },
      {
        id: "menu-lab-design",
        title: "Menu Lab Design & Preview",
        summary: "Layouts, Image density, hero, and Preview my menu design-edit.",
        updated: "2026-07-19",
        points: [
          "Open Menu Lab → Design to pick Default (Classic) or a gallery layout (Modern Dark, Steakhouse, Fast Casual, Family Dining).",
          "Set Image density to Thumbnail or All so dish photos appear on the public menu; None hides them.",
          "Upload or replace the menu hero image from Design, or use Preview my menu and Replace on the header photo.",
          "Preview my menu opens design-edit mode for owners — hover or tap photos for Replace / Delete / Fill / Fit.",
          "Use / Save Design applies the style to the live menu. Search KB: \"How do I change my menu design?\"",
        ],
      },
      {
        id: "billboards",
        title: "Billboards",
        summary: "Profile splash graphics — not the old Display Board / TV menu board.",
        updated: "2026-07-19",
        points: [
          "Open Billboards from the sidebar, or Feature as Billboard from a Deal.",
          "Create graphic-first splash creatives or link an offer to a menu item.",
          "Turn splash On/Off from the Billboards list. Review active dates so stale promos do not linger.",
          "Images: JPG, PNG, or WEBP up to 5 MB.",
        ],
      },
      {
        id: "menu-editing",
        title: "Menu Editing",
        summary: "Keep menu accuracy aligned with what the restaurant can fulfill.",
        points: [
          "Keep names, prices, and sections current so service does not rely on memory.",
          "Make menu changes before busy shifts whenever possible.",
          "After edits, review related items and modifiers for consistency.",
        ],
      },
      {
        id: "deals",
        title: "Deals",
        summary: "Deals should be operationally manageable, not just promotional.",
        points: [
          "Only run offers the team can actually support during service.",
          "Use simple headlines and clear expectations.",
          "Review deal status regularly so stale offers do not create confusion.",
        ],
      },
      {
        id: "hours",
        title: "Hours",
        summary: "Keep hours aligned with real service behavior.",
        points: [
          "Update hours before known changes, not after orders fail.",
          "Use exceptions deliberately for holidays or temporary changes.",
          "Treat inaccurate hours as an operations issue, not just profile copy.",
        ],
      },
      {
        id: "public-menu",
        title: "Public Menu",
        summary: "Your public menu should reflect what staff can actually fulfill.",
        points: [
          "Use the public menu as part of restaurant operations, not a separate system.",
          "If the customer can see it, the team should be ready to fulfill it.",
          "Review public-facing changes after major menu updates.",
        ],
      },
      {
        id: "qr-codes",
        title: "QR Codes",
        summary: "QR tools work best when placement is intentional.",
        points: [
          "Place codes where customers can scan without disrupting service flow.",
          "Review print quality and location before wide rollout.",
          "Treat QR placement as part of the restaurant's customer workflow.",
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    articles: [
      {
        id: "printer-not-printing",
        title: "Printer Not Printing",
        summary: "Check the simple path first before escalating.",
        points: [
          "Verify power, printer connection, and placement before assuming a software failure.",
          "Keep future hooks in mind for printer status detection and manual reprint actions.",
          "If the issue persists, run the print test flow again and note what failed.",
        ],
      },
      {
        id: "printer-reconnect",
        title: "Printer Reconnect",
        summary: "Connection drift often comes from placement or idle behavior.",
        points: [
          "Check whether the printer or tablet moved since the last working test.",
          "Use printer connection terminology rather than Bluetooth-only assumptions.",
          "If reconnect issues repeat, document the exact connection path and fallback plan.",
        ],
      },
      {
        id: "order-alert-problems",
        title: "Order Alert Problems",
        summary: "Treat alert failures as operational risk, not a minor preference.",
        points: [
          "Re-test volume in live restaurant noise, not in a quiet room.",
          "Check whether focus or silent settings are suppressing alerts.",
          "Confirm the device remains on the intended operations screen during service.",
        ],
      },
      {
        id: "tablet-sleep-issues",
        title: "Tablet Sleep Issues",
        summary: "The operations device should stay visible and ready.",
        points: [
          "Review display sleep and power behavior before service begins.",
          "Use a mounted, powered tablet instead of relying on battery-only operation.",
          "The long-term goal is an always-on order screen experience.",
        ],
      },
      {
        id: "connection-lost",
        title: "Connection Lost / Reconnecting",
        summary: "Stability matters more than temporary workarounds.",
        points: [
          "Verify the device is on the intended network at the actual work location.",
          "Look for weak zones near prep or kitchen areas.",
          "If reconnect behavior is frequent, fix the network setup before scaling the deployment.",
        ],
      },
      {
        id: "photo-upload-problems",
        title: "Photo or Logo Upload Problems",
        summary: "Fix format, size, plan, and display-setting issues before escalating.",
        points: [
          "Confirm you are uploading in the correct screen — logo in Profile, dish photo on item row, menu scan via Add via Upload.",
          "Convert HEIC/iPhone photos to JPEG or PNG for dish photo uploads.",
          "Check file size limits: logo 5 MB, banner 8 MB, hero 5 MB, dish 10 MB, billboard 5 MB, menu scan 20 MB.",
          "Logo upload requires Starter+; dish photos require Pro+. Check My Account plan if upload is locked.",
          "If a dish photo uploaded but does not appear publicly, set Menu Lab Design → Image density to Thumbnail or All.",
          "Search Knowledge Base: \"Why did my photo or logo upload fail?\"",
        ],
      },
      {
        id: "menu-upload-problems",
        title: "Menu Upload Problems",
        summary: "Use clean inputs and isolate the exact failure.",
        points: [
          "Check whether the source file is clear, complete, and in the expected format.",
          "If uploads stall, note whether the issue is file quality, processing time, or wrong mapping.",
          "When escalating, include the exact menu or item examples that failed.",
        ],
      },
    ],
  },
];

function articleMatches(article, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return [article.title, article.summary, ...(article.points || [])].join(" ").toLowerCase().includes(q);
}

function flattenArticles(sections) {
  return sections.flatMap((section) =>
    section.articles.map((article) => ({
      ...article,
      sectionId: section.id,
      sectionTitle: section.title,
    }))
  );
}

function normalizeArticleKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function SectionTitle({ eyebrow, title, subcopy }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {eyebrow ? <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a9ab0", marginBottom: 6 }}>{eyebrow}</div> : null}
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f1720", letterSpacing: "-0.03em" }}>{title}</h2>
      {subcopy ? <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "#5b6675" }}>{subcopy}</p> : null}
    </div>
  );
}

function severityStyles(severity) {
  if (severity === "warning") return { background: "#fff7ed", color: "#9a3412", border: "1px solid #fdba74" };
  if (severity === "error") return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" };
  return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd" };
}

function formatTicketDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export default function RestaurantHelpCenter() {
  const { selectedRestaurant, restaurants } = useOperator();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchAnswer, setSearchAnswer] = useState("");
  const [searchId, setSearchId] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searchEscalated, setSearchEscalated] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchFeedbackSent, setSearchFeedbackSent] = useState(false);
  const [issues, setIssues] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [ticketLoadError, setTicketLoadError] = useState("");
  const [ticketSubmitError, setTicketSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSectionId, setExpandedSectionId] = useState("getting-started");
  const [activeArticleId, setActiveArticleId] = useState("first-order-walkthrough");
  const [form, setForm] = useState({
    subject: "",
    category: TICKET_CATEGORIES[0],
    message: "",
  });

  async function loadKnownIssues() {
    const issueResponse = await getHelpKnownIssues();
    setIssues(issueResponse.issues || []);
  }

  async function loadTickets() {
    const ticketResponse = await getTickets();
    setTicketLoadError("");
    setTickets(ticketResponse.tickets || []);
  }

  useEffect(() => {
    setLoading(true);
    setPageError("");
    setTicketLoadError("");

    loadKnownIssues()
      .catch((err) => setPageError(err.message || "Unable to load Knowledge Base."))
      .finally(() => setLoading(false));

    loadTickets().catch((err) => {
      setTicketLoadError(err.message || "Tickets are temporarily unavailable.");
      setTickets([]);
    });
  }, []);

  const filteredSections = useMemo(() => {
    return OPERATIONS_SECTIONS.map((section) => ({
      ...section,
      articles: section.articles.filter((article) => articleMatches(article, query)),
    })).filter((section) => section.articles.length > 0);
  }, [query]);

  const filteredArticles = useMemo(() => flattenArticles(filteredSections), [filteredSections]);

  useEffect(() => {
    if (!filteredArticles.length) return;
    if (!filteredArticles.some((article) => article.id === activeArticleId)) {
      setActiveArticleId(filteredArticles[0].id);
      setExpandedSectionId(filteredArticles[0].sectionId);
    }
  }, [activeArticleId, filteredArticles]);

  const activeArticle = useMemo(() => {
    return filteredArticles.find((article) => article.id === activeArticleId) || filteredArticles[0] || null;
  }, [activeArticleId, filteredArticles]);

  const articleByTitle = useMemo(() => {
    const entries = flattenArticles(OPERATIONS_SECTIONS).map((article) => [normalizeArticleKey(article.title), article]);
    return new Map(entries);
  }, []);

  const openTickets = useMemo(
    () => tickets.filter((ticket) => !["closed", "resolved"].includes(String(ticket.status || "").toLowerCase())),
    [tickets]
  );

  function jumpToSupport() {
    document.getElementById("operations-support-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openArticle(articleId, sectionId) {
    setActiveArticleId(articleId);
    if (sectionId) setExpandedSectionId(sectionId);
    document.getElementById("operations-article-view")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleKnowledgeBaseSearch(event) {
    event.preventDefault();
    const searchText = query.trim();
    if (!searchText || searchLoading) return;

    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    setSearchAnswer("");
    setSearchId(null);
    setSearchMessage("");
    setSearchEscalated(false);
    setSearchFeedbackSent(false);

    try {
      const response = await answerKnowledgeBase(searchText);
      setSearchResults(response.articles || []);
      setSearchAnswer(response.answer || "");
      setSearchId(response.search_id || null);
      setSearchMessage(response.message || "");
      setSearchEscalated(Boolean(response.escalated));
    } catch (err) {
      setSearchError(
        err?.status >= 500
          ? "Knowledge Base search is temporarily unavailable. Please contact Menuply support."
          : err.message || "Knowledge Base search is temporarily unavailable."
      );
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSearchFeedback(feedback) {
    if (!searchId || searchFeedbackSent) return;
    setSearchFeedbackSent(true);
    try {
      await submitKnowledgeBaseFeedback(searchId, feedback);
    } catch {
      setSearchFeedbackSent(false);
    }
  }

  async function handleArticleResultClick(article) {
    if (!searchId || !article?.slug) return;
    await logKnowledgeBaseArticleClick(searchId, article.slug).catch(() => {});
  }

  async function handleSearchEscalation() {
    if (searchId) await logKnowledgeBaseEscalation(searchId).catch(() => {});
    jumpToSupport();
  }

  const quickActions = [
    { id: "pair-printer", label: "Pair Printer", action: () => openArticle("printer-connection-pairing", "hardware-setup") },
    { id: "test-print", label: "Test Print", action: () => openArticle("printer-test-ticket", "hardware-setup") },
    { id: "alert-volume", label: "Change Alert Volume", action: () => openArticle("order-alerts-volume", "orders-delivery") },
    { id: "incoming-orders", label: "View Incoming Orders", action: () => navigate("/operator/orders") },
    { id: "edit-menu", label: "Edit Menu", action: () => navigate("/operator/menulab") },
    { id: "manage-deals", label: "Manage Deals", action: () => navigate("/operator/deals") },
    { id: "staff-owner-pin", label: "Add Staff / Owner PIN", action: () => openArticle("owner-pin", "staff-access") },
    { id: "support-ticket", label: "Submit Support Ticket", action: jumpToSupport },
  ];

  async function handleSubmitTicket(event) {
    event.preventDefault();
    if (!selectedRestaurant?.id) {
      setTicketSubmitError("Select a restaurant before submitting a support ticket.");
      return;
    }
    setSubmitting(true);
    setTicketSubmitError("");
    setSuccess("");

    try {
      await createTicket({
        subject: form.subject.trim(),
        category: form.category,
        message: form.message.trim(),
        description: form.message.trim(),
        restaurant_id: selectedRestaurant?.id || null,
        source_page: "/operator/help",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        metadata: {
          restaurant_name: selectedRestaurant?.restaurant_name || null,
          article_id: activeArticle?.id || null,
          article_section: activeArticle?.sectionTitle || null,
          printer_status_hook: "future",
          reconnect_hook: "future",
          reprint_hook: "future",
        },
      });
      setForm({
        subject: "",
        category: TICKET_CATEGORIES[0],
        message: "",
      });
      setSuccess("Support request submitted.");
    } catch (err) {
      setTicketSubmitError(err.message || "Unable to submit support request.");
      setSubmitting(false);
      return;
    }

    try {
      await loadTickets();
    } catch (err) {
      setTicketLoadError(err.message || "Tickets are temporarily unavailable.");
      setTickets([]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!restaurants.length) {
    return (
      <OperatorLayout title="Knowledge Base">
        <div style={{ ...cardStyle, maxWidth: 560 }}>
          <SectionTitle
            eyebrow="Operations"
            title="Claim or link a restaurant first"
            subcopy="The Knowledge Base is available only inside the authenticated operator portal and support requests need a linked restaurant."
          />
          <p style={{ margin: 0, color: "#5b6675", lineHeight: 1.6 }}>
            Once a restaurant is linked to this account, the operations articles and support flow will attach to the selected location.
          </p>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout title="Knowledge Base">
      <div style={{ display: "grid", gap: 20 }}>
        <section
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #0f1720 0%, #1f4e3d 52%, #eef6f1 100%)",
            color: "#fff",
            border: "none",
          }}
        >
          <div className="operator-responsive-split" style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1.35fr) minmax(260px, 0.8fr)" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.78, marginBottom: 10 }}>
                Operator Portal
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(30px, 4vw, 46px)", lineHeight: 0.98, letterSpacing: "-0.05em" }}>
                Knowledge Base
              </h1>
              <p style={{ margin: "14px 0 0", maxWidth: 760, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.84)" }}>
                Set up Menuply, manage common restaurant workflows, and get help when needed. Guides show a Last updated date so you know when content was last reviewed.
              </p>
            </div>
            <div
              style={{
                alignSelf: "stretch",
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, marginBottom: 8 }}>Current restaurant</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedRestaurant?.restaurant_name || "No restaurant selected"}</div>
              <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                {selectedRestaurant?.city || ""}{selectedRestaurant?.state ? `, ${selectedRestaurant.state}` : ""}
              </div>
              <div style={{ fontSize: 12, opacity: 0.78, marginTop: 12 }}>
                Available to owner, manager, and staff. No Owner PIN is required to open this center.
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle}>
          <SectionTitle
            eyebrow="Help Search"
            title="Search the operations center"
            subcopy="Search Menuply help articles. Matching manual Knowledge Base content still appears below."
          />
          <form onSubmit={handleKnowledgeBaseSearch} style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search uploading menus, pausing orders, QR stickers, deals, or billing"
              style={inputStyle}
              maxLength={400}
            />
            <button
              type="submit"
              disabled={searchLoading || !query.trim()}
              style={{
                border: "none",
                borderRadius: 12,
                background: "#1F4E3D",
                color: "#fff",
                padding: "0 18px",
                fontSize: 14,
                fontWeight: 800,
                cursor: searchLoading || !query.trim() ? "default" : "pointer",
                opacity: searchLoading || !query.trim() ? 0.65 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </form>
          {searchError ? (
            <div style={{ marginTop: 14, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>
              {searchError}
            </div>
          ) : null}
          {searchMessage ? (
            <div style={{ marginTop: 14, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 12, padding: "12px 14px", fontSize: 13 }}>
              {searchMessage}
            </div>
          ) : null}
          {searchAnswer ? (
            <div style={{ marginTop: 16, border: "1px solid #cfe7da", background: "#f3fbf7", color: "#163f31", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#1F4E3D", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                AI Answer
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{searchAnswer}</div>
            </div>
          ) : null}
          {searchResults.length ? (
            <div style={{ marginTop: 16, border: "1px solid #d7deea", background: "#fbfcfd", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#1F4E3D", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Source Articles
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {searchResults.map((article) => {
                  const localArticle = articleByTitle.get(normalizeArticleKey(article.title));
                  return (
                    <div key={article.slug || article.title} style={{ border: "1px solid #e4e9f0", background: "#fff", borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 12, color: "#667085", fontWeight: 800, marginBottom: 4 }}>{article.category}</div>
                      {localArticle ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleArticleResultClick(article);
                            openArticle(localArticle.id, localArticle.sectionId);
                          }}
                          style={{
                            border: "none",
                            padding: 0,
                            background: "transparent",
                            color: "#1F4E3D",
                            fontSize: 15,
                            fontWeight: 900,
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          {article.title}
                        </button>
                      ) : (
                        <div style={{ color: "#0f1720", fontSize: 15, fontWeight: 900 }}>{article.title}</div>
                      )}
                      {article.summary ? (
                        <div style={{ fontSize: 13, lineHeight: 1.5, color: "#475467", marginTop: 6 }}>{article.summary}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
                <button type="button" onClick={() => handleSearchFeedback("up")} disabled={!searchId || searchFeedbackSent} style={feedbackButtonStyle}>
                  Helpful
                </button>
                <button type="button" onClick={() => handleSearchFeedback("down")} disabled={!searchId || searchFeedbackSent} style={feedbackButtonStyle}>
                  Not helpful
                </button>
                <button type="button" onClick={handleSearchEscalation} style={{ ...feedbackButtonStyle, color: searchEscalated ? "#991b1b" : "#1F4E3D" }}>
                  Contact Support
                </button>
              </div>
            </div>
          ) : null}
          {!searchResults.length && searchId ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
              <button type="button" onClick={handleSearchEscalation} style={{ ...feedbackButtonStyle, color: "#1F4E3D" }}>
                Contact Support
              </button>
            </div>
          ) : null}
        </section>

        <section style={cardStyle}>
          <SectionTitle
            eyebrow="Quick Actions"
            title="Go straight to the task"
            subcopy="Use real portal routes when they exist. Otherwise jump into the right operational guide."
          />
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {quickActions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                style={{
                  border: "1px solid #d7deea",
                  borderRadius: 16,
                  background: "#fff",
                  padding: "16px 18px",
                  textAlign: "left",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0f1720",
                  cursor: "pointer",
                  minHeight: 72,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <div className="operator-responsive-split" style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.3fr)", alignItems: "start" }}>
          <section className="operator-responsive-sticky" style={{ ...cardStyle, position: "sticky", top: 76 }}>
            <SectionTitle
              eyebrow="Guides"
              title="Operational sections"
              subcopy="Expandable quick-help sections designed for fast scanning on a landscape tablet."
            />
            <div style={{ display: "grid", gap: 12 }}>
              {filteredSections.map((section) => {
                const expanded = section.id === expandedSectionId;
                return (
                  <div key={section.id} style={{ border: "1px solid #eef2f6", borderRadius: 14, overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setExpandedSectionId(expanded ? "" : section.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        background: expanded ? "#edf7f2" : "#fff",
                        padding: "14px 16px",
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#0f1720",
                        cursor: "pointer",
                      }}
                    >
                      {section.title}
                    </button>
                    {expanded ? (
                      <div style={{ display: "grid", gap: 8, padding: "0 12px 12px" }}>
                        {section.articles.map((article) => {
                          const active = article.id === activeArticle?.id;
                          return (
                            <button
                              key={article.id}
                              type="button"
                              onClick={() => openArticle(article.id, section.id)}
                              style={{
                                textAlign: "left",
                                border: active ? "1px solid #1F4E3D" : "1px solid #eef2f6",
                                background: active ? "#f6fbf8" : "#fff",
                                borderRadius: 12,
                                padding: "12px 13px",
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1720", marginBottom: 4 }}>
                                {article.title}
                              </div>
                              <div style={{ fontSize: 12, color: "#5b6675", lineHeight: 1.5 }}>
                                {article.summary}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!loading && !filteredArticles.length ? <p style={{ margin: 0, color: "#8a9ab0" }}>No operational guides matched that search.</p> : null}
              {loading ? <p style={{ margin: 0, color: "#8a9ab0" }}>Loading operations content…</p> : null}
            </div>
          </section>

          <section id="operations-article-view" style={cardStyle}>
            {activeArticle ? (
              <>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#1F4E3D" }}>
                    {activeArticle.sectionTitle}
                  </span>
                  {(activeArticle.id === "recommended-tablet" || activeArticle.id === "recommended-printer") ? (
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: "#f4f7fb",
                        color: "#5b6675",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Recommended Hardware
                    </span>
                  ) : null}
                </div>
                <h2 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", color: "#0f1720" }}>
                  {activeArticle.title}
                </h2>
                <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
                  {activeArticle.summary}
                </p>
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#8a9ab0" }}>
                  Last updated: {activeArticle.updated || HELP_CONTENT_UPDATED}
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {activeArticle.points.map((point, index) => (
                    <div
                      key={`${activeArticle.id}-${index}`}
                      style={{
                        border: "1px solid #eef2f6",
                        borderRadius: 12,
                        padding: "12px 14px",
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "#475467",
                      }}
                    >
                      {point}
                    </div>
                  ))}
                </div>
                {(activeArticle.id === "recommended-tablet" || activeArticle.id === "recommended-printer") ? (
                  <div
                    style={{
                      marginTop: 18,
                      border: "1px solid #d7deea",
                      background: "#f8fafc",
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "#5b6675",
                    }}
                  >
                    Other hardware may work, but Menuply recommends tested hardware to simplify setup and improve operational reliability.
                  </div>
                ) : null}
                {(activeArticle.id === "printer-test-ticket" || activeArticle.id === "printer-not-printing" || activeArticle.id === "printer-reconnect") ? (
                  <div
                    style={{
                      marginTop: 18,
                      border: "1px solid #eef2f6",
                      borderRadius: 12,
                      padding: "14px",
                      background: "#fbfcfd",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f1720" }}>Future reliability hooks</div>
                    <div style={{ fontSize: 13, color: "#5b6675" }}>Printer status detection</div>
                    <div style={{ fontSize: 13, color: "#5b6675" }}>Reconnect messaging</div>
                    <div style={{ fontSize: 13, color: "#5b6675" }}>Print retry flow</div>
                    <div style={{ fontSize: 13, color: "#5b6675" }}>Manual reprint actions</div>
                    <div style={{ fontSize: 13, color: "#5b6675" }}>Printer troubleshooting guidance</div>
                  </div>
                ) : null}
              </>
            ) : (
              <p style={{ margin: 0, color: "#8a9ab0" }}>Select an article to read.</p>
            )}
          </section>
        </div>

        <section style={cardStyle}>
          <SectionTitle
            eyebrow="Current Notices"
            title="Operational notices"
            subcopy="Existing authenticated notices, kept secondary to the self-service workflow."
          />
          <div style={{ display: "grid", gap: 12 }}>
            {issues.map((issue) => {
              const styles = severityStyles(issue.severity);
              return (
                <div
                  key={issue.id}
                  style={{
                    ...styles,
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {issue.title}
                </div>
              );
            })}
            {!issues.length ? <p style={{ margin: 0, color: "#8a9ab0" }}>No active notices.</p> : null}
          </div>
        </section>

        <section id="operations-support-form" style={cardStyle}>
          <SectionTitle
            eyebrow="Contact Menuply"
            title="Direct help is still available"
            subcopy="Support stays below self-service content so the page feels like an operational console first."
          />
          {!selectedRestaurant?.id ? (
            <div style={{ marginBottom: 16, border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e", borderRadius: 12, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>
              Select a restaurant in the operator portal before submitting a support ticket so the request is attached to the correct location.
            </div>
          ) : null}
          {ticketLoadError ? (
            <div style={{ marginBottom: 16, border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e", borderRadius: 12, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>
              {ticketLoadError}
            </div>
          ) : null}
          {ticketSubmitError ? (
            <div style={{ marginBottom: 16, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 12, padding: "12px 14px", fontSize: 13, lineHeight: 1.6 }}>
              {ticketSubmitError}
            </div>
          ) : null}
          <form onSubmit={handleSubmitTicket} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
            <input
              type="text"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Subject"
              required
              style={inputStyle}
            />
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              style={inputStyle}
            >
              {TICKET_CATEGORIES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Describe the issue, expected behavior, and what the restaurant already tried."
              required
              style={textareaStyle}
            />
            <button
              className="operator-responsive-button"
              type="submit"
              disabled={submitting || !selectedRestaurant?.id}
              style={{
                border: "none",
                borderRadius: 12,
                background: "#1F4E3D",
                color: "#fff",
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 800,
                cursor: (submitting || !selectedRestaurant?.id) ? "default" : "pointer",
                opacity: (submitting || !selectedRestaurant?.id) ? 0.7 : 1,
                width: "fit-content",
              }}
            >
              {submitting ? "Submitting…" : "Submit Support Ticket"}
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <SectionTitle
              eyebrow="Recent Tickets"
              title="Your open requests"
              subcopy="A quick view of active support threads for this operator account."
            />
            <div style={{ display: "grid", gap: 12 }}>
              {openTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} style={{ border: "1px solid #eef2f6", borderRadius: 12, padding: 14 }}>
                  <div className="operator-responsive-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f1720" }}>{ticket.subject}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#8a9ab0" }}>
                      {ticket.status}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#5b6675", lineHeight: 1.6 }}>
                    {ticket.restaurant_name || selectedRestaurant?.restaurant_name || "Restaurant not set"}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a9ab0", marginTop: 6 }}>
                    Updated {formatTicketDate(ticket.updated_at)}
                  </div>
                </div>
              ))}
              {!ticketLoadError && !openTickets.length ? <p style={{ margin: 0, color: "#8a9ab0" }}>No open tickets right now.</p> : null}
            </div>
          </div>
        </section>

        {pageError ? (
          <div style={{ ...cardStyle, borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
            {pageError}
          </div>
        ) : null}

        {success ? (
          <div style={{ ...cardStyle, borderColor: "#86efac", background: "#f0fdf4", color: "#166534" }}>
            {success}
          </div>
        ) : null}
      </div>
    </OperatorLayout>
  );
}
