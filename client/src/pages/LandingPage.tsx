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
          Every Trades
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
           SuperDex, the next generation of on-chain trading on Base with up to 100x leverage. Swap, trade, and leverage all powered by shared liquidity.
          
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
        {/* Browser chrome frame */}
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            background: "#0a0a0a",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05), 0 80px 160px rgba(0,0,0,0.9), 0 0 100px rgba(0,188,132,0.05)",
          }}
        >
          {/* Browser top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "#0a0a0a",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: c, opacity: 0.85 }} />
              ))}
            </div>
            <div
              style={{
                marginLeft: 12,
                height: 26,
                flex: 1,
                maxWidth: 320,
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <path d="M5 2v3l2 1" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
                dex.superswapfi.xyz
              </span>
            </div>
          </div>

          {/* Real app screenshot */}
          <img
            src="/figmaAssets/app-preview.png"
            alt="SuperSwap trading interface"
            data-testid="img-app-preview"
            style={{
              width: "100%",
              display: "block",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </div>

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 180,
            background: "linear-gradient(to top, #080808 20%, transparent)",
            pointerEvents: "none",
          }}
        />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{
          padding: "120px 24px",
          backgroundColor: "#080808",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontFamily: "'Fragment Mono', monospace",
              fontSize: "clamp(32px, 5vw, 56px)",
              color: "#e8e8e8",
              marginBottom: 70,
              letterSpacing: "-0.03em",
            }}
          >
            Built for serious traders
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {[
              {
                title: "Unified Cross-Margin",
                desc: "Trade all markets from one collateral pool",
              },
              {
                title: "Multi-Asset Collateral",
                desc: "Use BTC, ETH, stablecoins and TradFi assets as margin",
              },
              {
                title: "Native Yield",
                desc: "Earn yield on idle collateral while you trade",
              },
              {
                title: "Zero Gas Trading",
                desc: "Trades settle off-chain with on-chain security",
              },
              {
                title: "TradFi Integration",
                desc: "Trade equities, forex, and commodities alongside crypto",
              },
              {
                title: "Advanced Order Types",
                desc: "Market, limit, scaled, and conditional orders",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                style={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 28,
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "rgba(0,188,132,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      background: "#00bc84",
                      transform: "rotate(45deg)",
                    }}
                  />
                </div>

                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#e8e8e8",
                    marginBottom: 10,
                  }}
                >
                  {feature.title}
                </h3>

                <p
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.7,
                    fontSize: 15,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
      
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{
          padding: "140px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "'Fragment Mono', monospace",
            fontSize: "clamp(40px, 6vw, 72px)",
            lineHeight: 1.1,
            color: "#e8e8e8",
            marginBottom: 32,
            letterSpacing: "-0.03em",
          }}
        >
          Ready to trade everything?
        </h2>

        <a
          href="https://dex.superswapfi.xyz"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "16px 40px",
            backgroundColor: "#00bc84",
            color: "#080808",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 16,
            textDecoration: "none",
            boxShadow: "0 0 40px rgba(0,188,132,0.35)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#00d496";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#00bc84";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Start Trading
        </a>
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
