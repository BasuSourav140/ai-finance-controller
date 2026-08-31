import {
  AlertTriangle,
  Building2,
  CalendarX2,
  Code2,
} from "lucide-react";

interface Policy {
  id: string;
  title: string;
  description: string;
  severity: "WARNING" | "CRITICAL";
}

const POLICIES: Policy[] = [
  {
    id: "meal-limit",
    title: "Meal Expense Limit",
    description:
      "Meal expenses above ₹3,000 require review.",
    severity: "WARNING",
  },
  {
    id: "software-control",
    title: "Software / SaaS Control",
    description:
      "Software expenses require a department_code.",
    severity: "WARNING",
  },
  {
    id: "invoice-date",
    title: "Invoice Date Required",
    description:
      "Missing invoice dates are treated as Critical Risk.",
    severity: "CRITICAL",
  },
];

const ICONS = {
  "meal-limit": AlertTriangle,
  "software-control": Code2,
  "invoice-date": CalendarX2,
};

export function PolicyPanel() {
  return (
    <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-indigo-500/10 p-2">
          <Building2
            size={17}
            className="text-indigo-400"
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">
            Current Company Policies
          </h2>

          <p className="text-xs text-slate-500">
            Read-only enforcement rules
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {POLICIES.map((policy) => {
          const Icon = ICONS[policy.id as keyof typeof ICONS];

          return (
            <div
              key={policy.id}
              className="rounded-xl border border-white/5 bg-black/20 p-3.5"
            >
              <div className="flex gap-3">
                <Icon
                  size={16}
                  className={
                    policy.severity === "CRITICAL"
                      ? "mt-0.5 text-red-400"
                      : "mt-0.5 text-amber-400"
                  }
                />

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">
                      {policy.title}
                    </p>

                    {policy.severity === "CRITICAL" && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-red-400">
                        Critical
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {policy.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}