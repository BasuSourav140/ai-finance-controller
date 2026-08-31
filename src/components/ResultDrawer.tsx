import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Code2,
  FileText,
  Hash,
  ShieldAlert,
  ShieldCheck,
  X,
  Building2,
  Wallet,
} from "lucide-react";

import { useState } from "react";

import type {
  AuditedInvoice,
  RiskLevel,
} from "../types";

interface ResultDrawerProps {
  invoice:
    | AuditedInvoice
    | null;

  onClose: () => void;
}

const riskStyles: Record<
  RiskLevel,
  {
    label: string;
    className: string;
    iconClassName: string;
  }
> = {
  LOW: {
    label: "Low Risk",
    className:
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    iconClassName:
      "text-emerald-400",
  },

  MEDIUM: {
    label: "Medium Risk",
    className:
      "border-amber-500/20 bg-amber-500/5 text-amber-300",
    iconClassName:
      "text-amber-400",
  },

  HIGH: {
    label: "High Risk",
    className:
      "border-orange-500/20 bg-orange-500/5 text-orange-300",
    iconClassName:
      "text-orange-400",
  },

  CRITICAL: {
    label: "Critical Risk",
    className:
      "border-red-500/20 bg-red-500/5 text-red-300",
    iconClassName:
      "text-red-400",
  },
};

function formatCurrency(
  amount: number
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

function formatDate(
  value: string
): string {
  if (!value) {
    return "Not provided";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export function ResultDrawer({
  invoice,
  onClose,
}: ResultDrawerProps) {
  const [
    showRawJson,
    setShowRawJson,
  ] = useState(false);

  const [
    showSource,
    setShowSource,
  ] = useState(false);

  if (!invoice) {
    return null;
  }

  const isViolation =
    invoice.policy_violation;

  const risk =
    riskStyles[
      invoice.risk_level
    ];

  return (
    <div className="fixed inset-0 z-50">

      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close audit details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#090b10] shadow-2xl shadow-black/40">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-indigo-500/10 p-2.5">

              <FileText
                size={18}
                className="text-indigo-400"
              />

            </div>

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Transaction Audit
              </p>

              <h2 className="mt-1 text-sm font-semibold text-white">
                Financial Control Review
              </h2>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* Decision banner */}
          <div
            className={`rounded-2xl border p-5 ${
              isViolation
                ? "border-red-500/20 bg-red-500/[0.045]"
                : "border-emerald-500/20 bg-emerald-500/[0.045]"
            }`}
          >

            <div className="flex items-start gap-4">

              <div
                className={`rounded-xl p-2.5 ${
                  isViolation
                    ? "bg-red-500/10"
                    : "bg-emerald-500/10"
                }`}
              >

                {isViolation ? (
                  <ShieldAlert
                    size={20}
                    className="text-red-400"
                  />
                ) : (
                  <ShieldCheck
                    size={20}
                    className="text-emerald-400"
                  />
                )}

              </div>

              <div className="min-w-0 flex-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h3
                    className={`text-base font-bold ${
                      isViolation
                        ? "text-red-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {isViolation
                      ? "Policy Violation"
                      : "Policy Passed"}
                  </h3>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${risk.className}`}
                  >
                    {risk.label}
                  </span>

                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">

                  {isViolation
                    ? "This transaction requires attention before it can be approved."
                    : "This transaction satisfies the current company expense policy."}

                </p>

              </div>

            </div>

          </div>


          {/* Transaction summary */}
          <section className="mt-6">

            <div className="mb-3 flex items-center gap-2">

              <Wallet
                size={14}
                className="text-slate-600"
              />

              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Transaction Summary
              </h3>

            </div>

            <div className="overflow-hidden rounded-xl border border-white/10">

              {/* Vendor */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">

                <div className="flex items-center gap-2 text-xs text-slate-600">

                  <Building2 size={13} />

                  Vendor

                </div>

                <span className="max-w-[60%] truncate text-right text-xs font-medium text-slate-300">
                  {invoice.vendor_name ||
                    "Not provided"}
                </span>

              </div>


              {/* Amount */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">

                <div className="flex items-center gap-2 text-xs text-slate-600">

                  <Wallet size={13} />

                  Total Amount

                </div>

                <span className="text-sm font-bold text-white">
                  {formatCurrency(
                    invoice.total_amount
                  )}
                </span>

              </div>


              {/* Category */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">

                <span className="text-xs text-slate-600">
                  Category
                </span>

                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-slate-300">
                  {invoice.category ||
                    "Uncategorized"}
                </span>

              </div>


              {/* Invoice date */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">

                <div className="flex items-center gap-2 text-xs text-slate-600">

                  <CalendarDays size={13} />

                  Invoice Date

                </div>

                <span className="text-xs text-slate-300">
                  {formatDate(
                    invoice.invoice_date
                  )}
                </span>

              </div>


              {/* Department code */}
              <div className="flex items-center justify-between px-4 py-3">

                <div className="flex items-center gap-2 text-xs text-slate-600">

                  <Hash size={13} />

                  Department Code

                </div>

                <span
                  className={`text-xs ${
                    invoice.department_code
                      ? "text-slate-300"
                      : "font-medium text-red-400"
                  }`}
                >
                  {invoice.department_code ||
                    "Missing"}
                </span>

              </div>

            </div>

          </section>


          {/* ==================================================
              POLICY EVALUATION
              ================================================== */}

          <section className="mt-6">

            <div className="mb-3 flex items-center justify-between">

              <div className="flex items-center gap-2">

                <ShieldCheck
                  size={14}
                  className={
                    isViolation
                      ? "text-red-400"
                      : "text-emerald-400"
                  }
                />

                <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Policy Evaluation
                </h3>

              </div>

              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  isViolation
                    ? "border-red-500/20 bg-red-500/5 text-red-400"
                    : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                }`}
              >
                {isViolation
                  ? "FAIL"
                  : "PASS"}
              </span>

            </div>


            {/* Policy cards */}
            {invoice.violations.length >
            0 ? (

              <div className="space-y-3">

                {invoice.violations.map(
                  (
                    violation
                  ) => (
                    <div
                      key={
                        violation.policy_id
                      }
                      className="rounded-xl border border-red-500/15 bg-red-500/[0.035] p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex items-start gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">

                            <ShieldAlert
                              size={15}
                              className="text-red-400"
                            />

                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="rounded-md border border-red-500/20 bg-red-500/5 px-2 py-0.5 font-mono text-[9px] font-bold text-red-400">
                                {
                                  violation.policy_id
                                }
                              </span>

                              <p className="text-xs font-semibold text-slate-200">
                                {
                                  violation.policy_name
                                }
                              </p>

                            </div>

                            <p className="mt-2 text-[11px] leading-5 text-red-200/70">
                              {
                                violation.message
                              }
                            </p>

                          </div>

                        </div>

                        <span className="shrink-0 rounded-full border border-red-500/20 bg-red-500/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-400">
                          FAIL
                        </span>

                      </div>

                    </div>
                  )
                )}

              </div>

            ) : (

              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.035] p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">

                    <CheckCircle2
                      size={16}
                      className="text-emerald-400"
                    />

                  </div>

                  <div>

                    <p className="text-xs font-semibold text-emerald-300">
                      All policies passed
                    </p>

                    <p className="mt-1 text-[11px] text-slate-600">
                      No deterministic policy violations were detected.
                    </p>

                  </div>

                </div>

              </div>

            )}

          </section>


          {/* Recommendation */}
          <section className="mt-6">

            <div className="mb-3 flex items-center gap-2">

              <CheckCircle2
                size={14}
                className={
                  isViolation
                    ? "text-amber-400"
                    : "text-emerald-400"
                }
              />

              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Strategic Recommendation
              </h3>

            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-4">

              <p className="text-sm leading-6 text-slate-300">
                {
                  invoice.strategic_recommendation
                }
              </p>

            </div>

          </section>


          {/* Raw JSON */}
          <section className="mt-6">

            <button
              type="button"
              onClick={() =>
                setShowRawJson(
                  (
                    current
                  ) => !current
                )
              }
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left transition hover:bg-white/[0.04]"
            >

              <div className="flex items-center gap-2">

                <Code2
                  size={14}
                  className="text-slate-600"
                />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Raw Agent JSON
                </span>

              </div>

              <ChevronDown
                size={15}
                className={`text-slate-600 transition ${
                  showRawJson
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

            {showRawJson && (
              <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[11px] leading-5 text-slate-400">
                {JSON.stringify(
                  invoice,
                  null,
                  2
                )}
              </pre>
            )}

          </section>


          {/* Original source */}
          <section className="mt-3">

            <button
              type="button"
              onClick={() =>
                setShowSource(
                  (
                    current
                  ) => !current
                )
              }
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-left transition hover:bg-white/[0.04]"
            >

              <div className="flex items-center gap-2">

                <Clipboard
                  size={14}
                  className="text-slate-600"
                />

                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Original Document
                </span>

              </div>

              <ChevronDown
                size={15}
                className={`text-slate-600 transition ${
                  showSource
                    ? "rotate-180"
                    : ""
                }`}
              />

            </button>

            {showSource && (
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[11px] leading-5 text-slate-400">
                {
                  invoice.raw_input
                }
              </pre>
            )}

          </section>

        </div>


        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4">

          <div className="flex items-center justify-between text-[10px] text-slate-700">

            <span>
              Audited{" "}
              {new Intl.DateTimeFormat(
                "en-IN",
                {
                  dateStyle:
                    "medium",
                  timeStyle:
                    "short",
                }
              ).format(
                new Date(
                  invoice.audited_at
                )
              )}
            </span>

            <span className="flex items-center gap-1.5">

              <ShieldCheck
                size={12}
              />

              Policy Engine Verified

            </span>

          </div>

        </div>

      </aside>

    </div>
  );
}