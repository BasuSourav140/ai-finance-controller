import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

import type { PolicyStatus } from "../types";

interface StatusBadgeProps {
  status: PolicyStatus;
}

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  const passed = status === "PASS";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        "rounded-full border px-2.5 py-1",
        "text-xs font-semibold",
        passed
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/20 bg-red-500/10 text-red-400",
      ].join(" ")}
    >
      {passed ? (
        <CheckCircle2 size={13} />
      ) : (
        <XCircle size={13} />
      )}

      {passed ? "PASS" : "FAIL"}
    </span>
  );
}