import { Alert } from "@/types/weather";

const typeStyles = {
  danger: { bg: "bg-red-50", border: "border-red-200", title: "text-red-700", body: "text-red-600", badge: "bg-red-100 text-red-700" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-700", body: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
  info: { bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-700", body: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
};

export default function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => {
        const s = typeStyles[a.type];
        return (
          <div key={a.id} className={`${s.bg} ${s.border} border rounded-2xl px-4 py-3 flex items-start gap-3`}>
            <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm ${s.title}`}>{a.title}</div>
              <div className={`text-xs mt-0.5 ${s.body}`}>{a.body}</div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${s.badge}`}>
              {a.type === "danger" ? "DANGER" : a.type === "warning" ? "WARN" : "INFO"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
