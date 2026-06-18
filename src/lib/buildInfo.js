export function getBuildInfoUrl() {
  return "/build-info.json";
}

export async function fetchBuildInfo() {
  const res = await fetch(getBuildInfoUrl(), { cache: "no-store" });
  if (!res.ok) throw new Error(`build-info fetch failed: ${res.status}`);
  return res.json();
}
