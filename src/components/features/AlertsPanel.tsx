import { Alert } from "@/types/weather";

const typeStyles = {
  danger: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.3)",
    title: "#f87171",
    body: "#fca5a5",
    badge: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
    label: "DANGER",
  },
  warning: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    title: "#fbbf24",
    body: "#fcd34d",
    badge: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    label: "WARN",
  },
  info: {
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.3)",
    title: "#34d399",
    body: "#6ee7b7",
    badge: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    label: "INFO",
  },
};

export default function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => {
        const s = typeStyles[a.type];
        return (
          <div
            key={a.id}
            className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: s.title }}>{a.title}</div>
              <div className="text-xs mt-0.5" style={{ color: s.body }}>{a.body}</div>
            </div>
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
              style={{ background: s.badge.bg, color: s.badge.color }}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
