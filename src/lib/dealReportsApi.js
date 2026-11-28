/**
 * Diner deal reports (plan 78, Andre 2026-11-27/28). "Informational use only": a report never creates a
 * deal; only the restaurant does. Signed-in, verified-email diners; CK decides every write.
 * Sent after the normal Post (the clip upload is unchanged). Listed restaurant/dish = ids; a restaurant
 * or dish not on Menuply = its typed name (same as Invite to Eat).
 */
import { apiPost } from "./api.js";
import { dealReportBody } from "./dealReportBody.js";

export { dealReportBody };

/** Deals → "+ Report a Deal" opens Post with Report a Deal ticked. */
export const OPEN_REPORT_DEAL_EVENT = "menuply:open-report-deal";

export function openReportDeal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_REPORT_DEAL_EVENT));
}

/** → "Your deal report is in Deals." | "Menuply is checking…" | the reason it didn't go through. */
export async function sendDealReport(input) {
  try {
    const out = await apiPost("/api/consumer/deal-reports", dealReportBody(input));
    return out?.held ? "Menuply is checking your deal report." : "Your deal report is in Deals.";
  } catch (err) {
    const why = err?.status === 401 ? "sign in to report a deal." : String(err?.error || err?.message || "try again later.");
    return `Your clip posted, but the deal report didn't: ${why}`;
  }
}
