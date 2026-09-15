// ────────────────────────────────────────────────────────────────────────────
// Per-organization daily AI quota — protects the platform's shared API keys.
// BYOK organizations (they saved their own key) are unlimited: they pay
// their own provider directly.
// ────────────────────────────────────────────────────────────────────────────

import { COL, countDocs } from "@/lib/firestore";
import { getEffectiveApiConfig } from "@/lib/apiKeys";

export interface QuotaState {
  allowed: boolean;
  used: number;
  limit: number; // -1 = unlimited (BYOK)
  byok: boolean;
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function checkOrgAIQuota(
  organizationId: string | null | undefined
): Promise<QuotaState> {
  if (!organizationId) return { allowed: false, used: 0, limit: 0, byok: false };

  const limit = parseInt(process.env.AI_DAILY_QUOTA || "200", 10);

  try {
    // BYOK orgs are unlimited — they use their own key, not platform credits
    const cfg = await getEffectiveApiConfig(organizationId).catch(() => null);
    if (cfg?.isBYOK) {
      return { allowed: true, used: 0, limit: -1, byok: true };
    }

    // Count today's outbound AI messages for this org
    const used = await countDocs(COL.whatsappMessages, {
      where: [
        ["organizationId", "==", organizationId],
        ["direction", "==", "OUTBOUND"],
        ["createdAt", ">=", startOfTodayIso()],
      ],
    }).catch(() => 0);

    return { allowed: used < limit, used, limit, byok: false };
  } catch (e) {
    // Fail open — never block business on quota system errors
    console.warn("[Quota] check failed, allowing:", e);
    return { allowed: true, used: 0, limit, byok: false };
  }
}
