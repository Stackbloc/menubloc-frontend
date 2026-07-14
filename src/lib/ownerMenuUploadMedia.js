import { OWNER_API_BASE } from "./ownerApi.js";

/** Resolve capture/page image URLs for owner Menu Manager surfaces. */
export function buildOwnerUploadImageUrl(relativePath) {
  if (!relativePath) return null;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${OWNER_API_BASE}${relativePath.startsWith("/") ? "" : "/"}${relativePath}`;
}
