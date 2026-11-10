import { useEffect, useState } from "react";
import { loadMyInviteCode } from "../lib/pendingInviteCode.js";

/** The signed-in diner's Invite friends code, or null (signed out, not loaded yet, or before mig 0415). */
export function useMyInviteCode() {
  const [code, setCode] = useState(null);
  useEffect(() => {
    let alive = true;
    loadMyInviteCode().then((c) => { if (alive) setCode(c || null); });
    return () => { alive = false; };
  }, []);
  return code;
}
