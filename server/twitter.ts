import { randomBytes, createHash } from "crypto";

const CLIENT_ID = process.env.TWITTER_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET ?? "";
const CALLBACK_URL =
  process.env.TWITTER_CALLBACK_URL ||
  `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/twitter/callback`;

export function isConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

export function getCallbackUrl(): string {
  return CALLBACK_URL;
}

// ─── PKCE state map ──────────────────────────────────────────────────────────
type StateEntry = { wallet: string; codeVerifier: string; ts: number };
const stateMap = new Map<string, StateEntry>();

setInterval(() => {
  const cutoff = Date.now() - 10 * 60_000;
  for (const [k, v] of stateMap) if (v.ts < cutoff) stateMap.delete(k);
}, 10 * 60_000);

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

// ─── OAuth URL ───────────────────────────────────────────────────────────────
export function buildAuthUrl(wallet: string): string {
  if (!isConfigured()) throw new Error("TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET not set");
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const state = randomBytes(16).toString("hex");
  stateMap.set(state, { wallet: wallet.toLowerCase(), codeVerifier: verifier, ts: Date.now() });
  const p = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: "tweet.read users.read follows.read like.read offline.access",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${p}`;
}

export function consumeState(state: string): StateEntry | null {
  const e = stateMap.get(state) ?? null;
  if (e) stateMap.delete(state);
  return e;
}

// ─── Token exchange ──────────────────────────────────────────────────────────
export async function exchangeCode(
  code: string,
  verifier: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: CALLBACK_URL,
      code_verifier: verifier,
    }).toString(),
  });
  if (!r.ok) {
    console.error("[twitter] token exchange failed:", await r.text());
    return null;
  }
  const d = await r.json();
  return { accessToken: d.access_token ?? "", refreshToken: d.refresh_token ?? "" };
}

// ─── Token refresh ───────────────────────────────────────────────────────────
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const r = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });
  if (!r.ok) return null;
  const d = await r.json();
  return { accessToken: d.access_token ?? "", refreshToken: d.refresh_token ?? refreshToken };
}

// ─── Get authenticated user ──────────────────────────────────────────────────
export async function getMe(
  accessToken: string
): Promise<{ id: string; username: string } | null> {
  const r = await fetch("https://api.twitter.com/2/users/me?user.fields=id,username", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) return null;
  const d = await r.json();
  return { id: d.data?.id ?? "", username: d.data?.username ?? "" };
}

// ─── Verification helpers ─────────────────────────────────────────────────────

export async function checkFollow(
  accessToken: string,
  myUserId: string,
  targetUsername: string
): Promise<boolean> {
  // Look up target user ID by username
  const lr = await fetch(
    `https://api.twitter.com/2/users/by/username/${encodeURIComponent(targetUsername)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!lr.ok) return false;
  const ld = await lr.json();
  const targetId: string = ld.data?.id ?? "";
  if (!targetId) return false;

  // Paginate through user's following list (up to 3 pages × 1000 = 3000)
  let paginationToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    const params = new URLSearchParams({ max_results: "1000" });
    if (paginationToken) params.set("pagination_token", paginationToken);
    const fr = await fetch(
      `https://api.twitter.com/2/users/${myUserId}/following?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!fr.ok) return false;
    const fd = await fr.json();
    const list: { id: string }[] = fd.data ?? [];
    if (list.some((u) => u.id === targetId)) return true;
    paginationToken = fd.meta?.next_token;
    if (!paginationToken) break;
  }
  return false;
}

export async function checkLike(
  accessToken: string,
  myUserId: string,
  tweetId: string
): Promise<boolean> {
  let paginationToken: string | undefined;
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({ max_results: "100" });
    if (paginationToken) params.set("pagination_token", paginationToken);
    const r = await fetch(
      `https://api.twitter.com/2/users/${myUserId}/liked_tweets?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!r.ok) return false;
    const d = await r.json();
    const list: { id: string }[] = d.data ?? [];
    if (list.some((t) => t.id === tweetId)) return true;
    paginationToken = d.meta?.next_token;
    if (!paginationToken) break;
  }
  return false;
}

export async function checkRetweet(
  accessToken: string,
  myUserId: string,
  tweetId: string
): Promise<boolean> {
  let paginationToken: string | undefined;
  for (let page = 0; page < 3; page++) {
    const params = new URLSearchParams({ max_results: "100" });
    if (paginationToken) params.set("pagination_token", paginationToken);
    const r = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!r.ok) return false;
    const d = await r.json();
    const list: { id: string }[] = d.data ?? [];
    if (list.some((u) => u.id === myUserId)) return true;
    paginationToken = d.meta?.next_token;
    if (!paginationToken) break;
  }
  return false;
}

// ─── Parse verification_url → target identifier ──────────────────────────────
// For social_follow: returns the Twitter username (e.g. "superswapfi_")
// For social_like / social_retweet: returns the tweet ID (e.g. "1234567890")
export function parseTarget(verificationUrl: string, category: string): string | null {
  if (!verificationUrl) return null;
  try {
    if (!verificationUrl.startsWith("http")) {
      return verificationUrl.replace(/^@/, "").trim() || null;
    }
    const u = new URL(verificationUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (category === "social_follow") {
      return parts[0] ?? null;
    }
    // https://x.com/user/status/TWEET_ID
    const si = parts.indexOf("status");
    if (si !== -1 && parts[si + 1]) return parts[si + 1];
    return parts[parts.length - 1] ?? null;
  } catch {
    return verificationUrl.replace(/^@/, "").trim() || null;
  }
}
