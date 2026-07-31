import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, BellSlash, Warning, Spinner, ShieldCheck } from "@phosphor-icons/react";
import { usePushSubscription, type PermissionState } from "../hooks/usePushSubscription";
import { useT } from "../lib/i18n";

interface Props {
  children: ReactNode;
}

const PUSH_GATE_DISMISSED_KEY = "permission-push-gate-dismissed";

export function PushPermissionGate({ children }: Props) {
  const { isSubscribed, permissionState, error, subscribe } = usePushSubscription();
  const [resolved, setResolved] = useState(() => {
    try {
      return localStorage.getItem(PUSH_GATE_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const initiallySubscribed = useRef(isSubscribed);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSubscribed) {
      try {
        localStorage.removeItem(PUSH_GATE_DISMISSED_KEY);
      } catch {
        // ignore
      }
      const delay = initiallySubscribed.current ? 0 : 1500;
      const t = setTimeout(() => setResolved(true), delay);
      return () => clearTimeout(t);
    }
  }, [isSubscribed]);

  useEffect(() => {
    if (resolved) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    container?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previouslyFocused?.focus();
    };
  }, [resolved]);

  const handleSkip = () => {
    try {
      localStorage.setItem(PUSH_GATE_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
    setResolved(true);
  };

  if (import.meta.env.DEV) return <>{children}</>;

  if (resolved) return <>{children}</>;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      tabIndex={-1}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0f172a", padding: "0 24px",
      }}
    >
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        maxWidth: 340, width: "100%",
        padding: "32px 24px", borderRadius: 24,
        background: "rgba(15,23,42,0.85)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(24px)",
      }}>
        <div style={{ marginBottom: 24 }}>
          <GateIcon state={permissionState} />
        </div>

        {permissionState === "denied" && (
          <DeniedState onRetry={subscribe} onSkip={handleSkip} />
        )}
        {permissionState === "granted" && (
          <GrantedState />
        )}
        {permissionState === "error" && (
          <ErrorState message={error} onRetry={subscribe} onSkip={handleSkip} />
        )}
        {(permissionState === "idle" || permissionState === "loading") && (
          <IdleState isSubscribing={permissionState === "loading"} onSubscribe={subscribe} onSkip={handleSkip} />
        )}
      </div>
    </div>
  );
}

function GateIcon({ state }: { state: PermissionState }) {
  const iconStyle = {
    width: 80, height: 80, borderRadius: 20,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  if (state === "loading") {
    return (
      <div style={{ ...iconStyle, background: "rgba(59,130,246,0.1)" }}>
        <Spinner size={36} className="spin" color="#60a5fa" />
      </div>
    );
  }
  if (state === "granted") {
    return (
      <div style={{ ...iconStyle, background: "rgba(52,211,153,0.1)", borderColor: "rgba(52,211,153,0.2)" }}>
        <ShieldCheck size={36} color="#34d399" />
      </div>
    );
  }
  if (state === "denied") {
    return (
      <div style={{ ...iconStyle, background: "rgba(248,113,113,0.1)", borderColor: "rgba(248,113,113,0.2)" }}>
        <BellSlash size={36} color="#f87171" />
      </div>
    );
  }
  return (
    <div style={{ ...iconStyle, background: "rgba(59,130,246,0.1)" }}>
      <Bell size={36} color="#60a5fa" />
    </div>
  );
}

function IdleState({ isSubscribing, onSubscribe, onSkip }: { isSubscribing: boolean; onSubscribe: () => void; onSkip: () => void }) {
  const t = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", marginBottom: 8 }}>
          {t("pushGate.title")}
        </h2>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
          {t("pushGate.desc")}
        </p>
      </div>
      <button
        onClick={onSubscribe}
        disabled={isSubscribing}
        style={{
          width: "100%", height: 52, borderRadius: 14,
          border: "none", cursor: isSubscribing ? "not-allowed" : "pointer",
          fontSize: 15, fontWeight: 900, color: "#fff",
          background: "linear-gradient(135deg, #3b82f6, #6366f1)",
          opacity: isSubscribing ? 0.6 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {isSubscribing ? (
          <><Spinner size={18} className="spin" /> {t("pushGate.subscribing")}</>
        ) : (
          <><Bell size={18} /> {t("pushGate.subscribe")}</>
        )}
      </button>
      <button onClick={onSkip} style={{
        background: "none", border: "none", color: "#94a3b8",
        fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 4,
      }}>
        {t("pushGate.skip")}
      </button>
    </div>
  );
}

function DeniedState({ onRetry, onSkip }: { onRetry: () => void; onSkip: () => void }) {
  const t = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>
        {t("pushGate.denied.title")}
      </h2>
      <div style={{
        display: "flex", gap: 8, padding: 12, borderRadius: 12,
        background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
      }}>
        <Warning size={16} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 12, fontWeight: 700, color: "#fca5a5", margin: 0, lineHeight: 1.6 }}>
          {t("pushGate.denied.desc")}
        </p>
      </div>
      <button
        onClick={onRetry}
        style={{
          width: "100%", height: 48, borderRadius: 14,
          border: "1px solid rgba(248,113,113,0.2)",
          background: "rgba(248,113,113,0.1)",
          color: "#fca5a5", fontSize: 14, fontWeight: 900,
          cursor: "pointer",
        }}
      >
        {t("pushGate.denied.retry")}
      </button>
      <button onClick={onSkip} style={{
        background: "none", border: "none", color: "#94a3b8",
        fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 4,
      }}>
        {t("pushGate.skip")}
      </button>
    </div>
  );
}

function GrantedState() {
  const t = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: "#34d399" }}>
        {t("pushGate.granted.title")}
      </h2>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>
        {t("pushGate.granted.desc")}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry, onSkip }: { message: string | null; onRetry: () => void; onSkip: () => void }) {
  const t = useT();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: "#f1f5f9" }}>
        {t("pushGate.error.title")}
      </h2>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#f87171", margin: 0 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          width: "100%", height: 48, borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#cbd5e1", fontSize: 14, fontWeight: 900,
          cursor: "pointer",
        }}
      >
        {t("pushGate.error.retry")}
      </button>
      <button onClick={onSkip} style={{
        background: "none", border: "none", color: "#94a3b8",
        fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 4,
      }}>
        {t("pushGate.skip")}
      </button>
    </div>
  );
}
