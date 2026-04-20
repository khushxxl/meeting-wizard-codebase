import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const KEY_PREFIX = "sk_mw_";

export function generateApiKey() {
  const raw = KEY_PREFIX + randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

export function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function verifyApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const raw = authHeader.slice(7).trim();
  if (!raw.startsWith(KEY_PREFIX)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", hashApiKey(raw))
    .maybeSingle();

  if (error || !data) return null;

  // Fire-and-forget touch of last_used_at
  admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { keyId: data.id as string, userId: data.user_id as string };
}
