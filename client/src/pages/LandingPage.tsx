import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SiX, SiTelegram } from "react-icons/si";

/* ─── types ─────────────────────────────────────────────── */
interface RewardsStats {
  totalRewardsPaid: number;
  totalUsers: number;
  totalSwaps: number;
}

/* ─── helpers ───────────────────────────────────────────── */
function fmtStat(n: number, prefix = "") {
  if (!n) return "—";
  if (n >= 1_000_000) return prefix + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return prefix + (n / 1_000).toFixed(1) + "K";
  return prefix + n.toLocaleString();
}

/* ─── waveform bar data (deterministic, 72 bars) ────────── */
const BARS = Array.from({ length: 72 }, (_, i) => {
  const raw =
    Math.abs(Math.sin(i * 0.41) * 0.5 + Math.sin(i * 0.15) * 0.3 + Math.sin(i * 0.82) * 0.2);
  const height = 12 + raw * 88;
  const duration = 0.7 + Math.abs(Math.sin(i * 0.6)) * 1.1;
  const delay = (i * 0.038) % 1.6;
  return { height, duration, delay };
});

/* ─── animation variants ────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

/* ═══════════════════════════════════════════════════════════
   LandingPage
═══════════════════════════════════════════════════════════ */
export const LandingPage = (): JSX.Element => {
  const [, navigate] = useLocation();

  const { data: stats } = useQuery<RewardsStats>({
    queryKey: ["/api/rewards/stats"],
    staleTime: 60_000,
  });

  return (
    <div
      style={{
        background: "#080808",
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        fontFamily: "'Inter', sans-serif",
        color: "#e8e8e8",
      }}
    >

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          backgroundColor: "rgba(8,8,8,0.90)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 32px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            data-testid="link-landing-home"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <img
              src="/figmaAssets/logo.png"
              alt="SuperSwap"
              style={{ height: 28, width: "auto", objectFit: "contain" }}
            />
            <span
              style={{
                fontFamily: "'Fragment Mono', monospace",
                fontSize: 18,
                fontWeight: 400,
                color: "#e8e8e8",
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ color: "#e8e8e8" }}>Super</span>
              <span style={{ color: "#00bc84" }}>Swap</span>
            </span>
          </button>

          {/* Center nav links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            className="hidden md:flex"
          >
            {[
              { label: "Resources", href: "/docs" },
              { label: "Docs", href: "/docs" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                data-testid={`link-landing-${label.toLowerCase()}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e8e8e8")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right: socials + Launch App */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a
              href="https://x.com/superswapfi_"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter"
              data-testid="link-landing-twitter"
              style={{ color: "rgba(255,255,255,0.45)", lineHeight: 0, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e8e8e8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              <SiX size={16} />
            </a>
            <a
              href="https://t.me/superswapdex"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              data-testid="link-landing-telegram"
              style={{ color: "rgba(255,255,255,0.45)", lineHeight: 0, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#e8e8e8")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >
              <SiTelegram size={18} />
            </a>

            {/* Launch App button (desktop) */}
            <a
              href="https://dex.superswapfi.xyz"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-landing-launch-app"
              className="hidden md:inline-flex"
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#e8e8e8",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.20)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              Launch app
            </a>
          </div>
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════ */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "96px 24px 0",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          style={{
            fontFamily: "'Fragment Mono', monospace",
            fontSize: "clamp(38px, 6.5vw, 80px)",
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#e8e8e8",
            maxWidth: 760,
            margin: 0,
          }}
        >
          The DEX That Rewards
          <br />
          Every Swap
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          style={{
            marginTop: 28,
            maxWidth: 540,
            fontSize: "clamp(14px, 1.8vw, 16px)",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          SuperSwap finds you the best route across every DEX on Base, then automatically
          pays you $SUPER tokens on every trade — zero extra steps, real cashback, every time.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          style={{
            marginTop: 40,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {/* Start Trading — opens dex.superswapfi.xyz */}
          <a
            href="https://dex.superswapfi.xyz"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="button-landing-start-trading"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 44,
              padding: "0 24px",
              borderRadius: 8,
              backgroundColor: "#00bc84",
              border: "none",
              color: "#080808",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#00d496";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "#00bc84";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1.02)")}
          >
            Start trading
          </a>

          {/* Swap — opens /swap */}
          <button
            onClick={() => navigate("/swap")}
            data-testid="button-landing-swap"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 44,
              padding: "0 24px",
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#e8e8e8",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s, transform 0.1s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={e => (e.currentTarget.style.transform = "scale(1.02)")}
          >
            Swap now
          </button>
        </motion.div>

        {/* ── WAVEFORM BARS ─────────────────────────────── */}
        <motion.div
          variants={fadeIn}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1100,
            height: 160,
            marginTop: 64,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 3,
            overflow: "hidden",
          }}
        >
          {/* top fade */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "60%",
              background: "linear-gradient(to bottom, #080808, transparent)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          {/* bottom fade */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "30%",
              background: "linear-gradient(to top, #080808, transparent)",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />

          {BARS.map((bar, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: bar.height,
                borderRadius: 2,
                background: "linear-gradient(to top, rgba(0,188,132,0.15), rgba(0,188,132,0.85))",
                transformOrigin: "bottom center",
                flexShrink: 0,
                animation: `waveBar ${bar.duration.toFixed(2)}s ease-in-out ${bar.delay.toFixed(2)}s infinite alternate`,
              }}
            />
          ))}
        </motion.div>

        {/* ── STATS ROW ─────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 0,
            width: "100%",
            maxWidth: 700,
            marginTop: 8,
            paddingBottom: 40,
          }}
        >
          {[
            { label: "Rewards Paid", value: fmtStat(stats?.totalRewardsPaid ?? 0, "$") },
            { label: "Total Volume", value: fmtStat(stats?.totalSwaps ? stats.totalSwaps * 1800 : 0, "$") },
            { label: "Traders", value: fmtStat(stats?.totalUsers ?? 0) },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "0 40px",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div
                data-testid={`stat-${label.toLowerCase().replace(" ", "-")}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "'Fragment Mono', monospace",
                  fontSize: "clamp(18px, 2.5vw, 26px)",
                  fontWeight: 400,
                  color: "#e8e8e8",
                  letterSpacing: "-0.02em",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.35)", marginRight: 2 }}>—</span>
                {value}
              </div>
              <p
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                  letterSpacing: "0.01em",
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* ══ APP PREVIEW ═════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 24px 0",
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            background: "#0d0d0d",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.06), 0 60px 140px rgba(0,0,0,0.85), 0 0 80px rgba(0,188,132,0.04)",
          }}
        >
          {/* Browser top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "#0a0a0a",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {["#3a3a3a", "#3a3a3a", "#3a3a3a"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c }} />
              ))}
            </div>
            <div
              style={{
                marginLeft: 8,
                height: 24,
                flex: 1,
                maxWidth: 280,
                borderRadius: 5,
                backgroundColor: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                paddingLeft: 10,
              }}
            >
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                superswapfi.xyz
              </span>
            </div>

            {/* Tab bar mimicking SuperSwap */}
            <div
              className="hidden sm:flex"
              style={{ marginLeft: "auto", gap: 4, alignItems: "center" }}
            >
              {["Swap", "Earn", "Vault", "Rewards"].map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 5,
                    fontSize: 11,
                    color: i === 0 ? "#e8e8e8" : "rgba(255,255,255,0.35)",
                    backgroundColor: i === 0 ? "rgba(255,255,255,0.08)" : "transparent",
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>

          {/* App interface mockup */}
          <div
            style={{
              display: "flex",
              minHeight: 380,
              backgroundColor: "#080808",
            }}
          >
            {/* Left panel — swap UI */}
            <div
              style={{
                flex: 1,
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ width: "100%", maxWidth: 380 }}>
                {/* Swap card header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Fragment Mono', monospace",
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#e8e8e8",
                    }}
                  >
                    Swap
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      color: "#00bc84",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#00bc84",
                        boxShadow: "0 0 6px #00bc84",
                      }}
                    />
                    Live
                  </div>
                </div>

                {/* You Pay */}
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    padding: "14px 16px",
                    marginBottom: 6,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>
                    You Pay
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 8,
                        backgroundColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <img
                        src="/figmaAssets/image-7.png"
                        alt="ETH"
                        style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e8" }}>ETH</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>▾</span>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Fragment Mono', monospace",
                        fontSize: 22,
                        fontWeight: 400,
                        color: "#e8e8e8",
                      }}
                    >
                      1
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    ≈ $1,749.72
                  </p>
                </div>

                {/* Swap arrow */}
                <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#00bc84",
                      fontSize: 16,
                    }}
                  >
                    ⇅
                  </div>
                </div>

                {/* You Receive */}
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid rgba(0,188,132,0.2)",
                    backgroundColor: "rgba(0,188,132,0.04)",
                    padding: "14px 16px",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>
                    You Receive
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 8,
                        backgroundColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <img
                        src="/figmaAssets/image-5.png"
                        alt="USDC"
                        style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e8e8" }}>USDC</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>▾</span>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Fragment Mono', monospace",
                        fontSize: 22,
                        fontWeight: 400,
                        color: "#00bc84",
                      }}
                    >
                      1,749.72
                    </span>
                  </div>
                  <p style={{ margin: "8px 0 0", textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    ≈ $1,749.72
                  </p>
                </div>

                {/* Swap button */}
                <div
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 10,
                    backgroundColor: "#00bc84",
                    color: "#080808",
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Connect Wallet to Swap
                </div>

                {/* Cashback */}
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#00bc84",
                  }}
                >
                  <span>⚡</span>
                  <span>Est. Cashback: $2.50 · Earn $SUPER</span>
                </div>
              </div>
            </div>

            {/* Right panel — stats/chart (desktop only) */}
            <div
              className="hidden md:flex"
              style={{
                width: 360,
                flexShrink: 0,
                flexDirection: "column",
                padding: "28px 28px",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <img
                  src="/figmaAssets/image-7.png"
                  alt="ETH"
                  style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e8" }}>ETH / USDC</span>
                <span
                  style={{
                    marginLeft: 4,
                    padding: "2px 7px",
                    borderRadius: 5,
                    backgroundColor: "rgba(229,57,57,0.12)",
                    color: "#e05252",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  -6.31%
                </span>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Fragment Mono', monospace",
                    fontSize: 26,
                    fontWeight: 400,
                    color: "#e8e8e8",
                    margin: 0,
                    letterSpacing: "-0.03em",
                  }}
                >
                  1,749.72
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  USDC per ETH
                </p>
              </div>
              <img
                src="/figmaAssets/chart-line.png"
                alt="Price chart"
                style={{
                  width: "100%",
                  borderRadius: 8,
                  objectFit: "cover",
                  opacity: 0.75,
                }}
                onError={e => {
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Mini stats */}
              <div
                style={{
                  marginTop: "auto",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  { label: "24h Volume", value: "$4.2M" },
                  { label: "Liquidity", value: "$18.1M" },
                  { label: "Rewards Today", value: "$1.8K" },
                  { label: "Active Traders", value: "342" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{label}</p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontFamily: "'Fragment Mono', monospace",
                        fontSize: 14,
                        color: "#e8e8e8",
                        fontWeight: 400,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade over screenshot */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 140,
            background: "linear-gradient(to top, #080808 30%, transparent)",
            pointerEvents: "none",
          }}
        />
      </motion.section>

      {/* ══ FOOTER ══════════════════════════════════════════ */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "28px 32px",
          marginTop: 80,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/figmaAssets/logo.png"
              alt="SuperSwap"
              style={{ height: 18, width: "auto", objectFit: "contain" }}
            />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              © 2025 SuperSwap. All rights reserved.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {[
              { label: "Docs", href: "/docs" },
              { label: "X", href: "https://x.com/superswapfi_" },
              { label: "Telegram", href: "https://t.me/superswapdex" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.3)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#e8e8e8")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
