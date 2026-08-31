import {
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
} from "lucide-react";

import type { AuditMetrics } from "../types";

interface MetricsProps {
  metrics: AuditMetrics;
}

export function Metrics({
  metrics,
}: MetricsProps) {
  const cards = [
    {
      label: "Total Processed",
      value: `₹${metrics.totalAmount.toLocaleString(
        "en-IN"
      )}`,
      description: "Audited transaction value",
      icon: IndianRupee,
    },
    {
      label: "Policy Violations",
      value: metrics.violationCount,
      description: "Transactions requiring review",
      icon: AlertTriangle,
    },
    {
      label: "Clean Transactions",
      value: metrics.cleanCount,
      description: "Automatically compliant",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {card.value}
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  {card.description}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-2.5">
                <Icon
                  size={19}
                  className="text-slate-300"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}