import type { ReactNode } from "react";

import {
  AlertCircle,
  Check,
  Circle,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import type { AgentStatus } from "../types";

export interface AgentActivityEntry {
  id: string;
  status: AgentStatus;
  message: string;
  retryAttempt?: number;
  timestamp: string;
}

interface AgentActivityProps {
  entries: AgentActivityEntry[];
  currentStatus: AgentStatus;
}

interface StatusConfig {
  label: string;
  icon: ReactNode;
}

const STATUS_CONFIG: Record<
  AgentStatus,
  StatusConfig
> = {
  idle: {
    label: "Ready",
    icon: <Circle size={14} />,
  },

  extracting: {
    label: "Document extraction",
    icon: (
      <LoaderCircle
        size={14}
        className="animate-spin"
      />
    ),
  },

  validating: {
    label: "JSON validation",
    icon: (
      <LoaderCircle
        size={14}
        className="animate-spin"
      />
    ),
  },

  correcting: {
    label: "Self-correction",
    icon: (
      <RefreshCw size={14} />
    ),
  },

  evaluating: {
    label: "Policy evaluation",
    icon: (
      <ShieldCheck size={14} />
    ),
  },

  complete: {
    label: "Audit completed",
    icon: <Check size={14} />,
  },

  error: {
    label: "Manual review",
    icon: <X size={14} />,
  },
};

function getStatusClasses(
  status: AgentStatus
): string {
  switch (status) {
    case "complete":
      return "border-emerald-500/20 bg-emerald-500/5";

    case "error":
      return "border-red-500/20 bg-red-500/5";

    case "correcting":
      return "border-amber-500/20 bg-amber-500/5";

    case "evaluating":
      return "border-indigo-500/15 bg-indigo-500/[0.035]";

    default:
      return "border-white/10 bg-white/[0.025]";
  }
}

function getIconClasses(
  status: AgentStatus
): string {
  switch (status) {
    case "complete":
      return "bg-emerald-500/10 text-emerald-400";

    case "error":
      return "bg-red-500/10 text-red-400";

    case "correcting":
      return "bg-amber-500/10 text-amber-400";

    case "evaluating":
      return "bg-indigo-500/10 text-indigo-400";

    default:
      return "bg-white/5 text-slate-500";
  }
}

function formatTime(
  timestamp: string
): string {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ).format(
    new Date(timestamp)
  );
}

function getCurrentLabel(
  status: AgentStatus
): string {
  switch (status) {
    case "complete":
      return "Audit complete";

    case "error":
      return "Audit stopped";

    case "correcting":
      return "Self-correction active";

    case "evaluating":
      return "Policy engine active";

    case "validating":
      return "Validating response";

    case "extracting":
      return "Extracting document";

    default:
      return "Agent ready";
  }
}

export function AgentActivity({
  entries,
  currentStatus,
}: AgentActivityProps) {
  const currentConfig =
    STATUS_CONFIG[
      currentStatus
    ];

  const latestEntry =
    entries[
      entries.length - 1
    ];

  const isRunning =
    currentStatus ===
      "extracting" ||
    currentStatus ===
      "validating" ||
    currentStatus ===
      "correcting" ||
    currentStatus ===
      "evaluating";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">

            <ShieldCheck
              size={16}
            />

          </div>

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Agent Activity
            </p>

            <h3 className="mt-0.5 text-sm font-semibold text-white">
              AI Finance Controller
            </h3>

          </div>

        </div>

        {/* Current state */}
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">

          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isRunning
                ? "animate-pulse bg-indigo-400"
                : currentStatus ===
                    "error"
                  ? "bg-red-400"
                  : currentStatus ===
                      "complete"
                    ? "bg-emerald-400"
                    : "bg-slate-600"
            }`}
          />

          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            {getCurrentLabel(
              currentStatus
            )}
          </span>

        </div>

      </div>

      {/* Latest status */}
      {latestEntry && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 ${getStatusClasses(
            currentStatus
          )}`}
        >

          <div className="flex items-center gap-3">

            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${getIconClasses(
                currentStatus
              )}`}
            >

              {currentConfig.icon}

            </span>

            <div className="min-w-0 flex-1">

              <p className="text-xs font-medium text-slate-300">
                {getCurrentLabel(
                  currentStatus
                )}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-slate-600">
                {
                  latestEntry.message
                }
              </p>

            </div>

          </div>

        </div>
      )}

      {/* Execution timeline */}
      {entries.length > 0 ? (
        <div className="mt-5">

          <div className="mb-3 flex items-center justify-between">

            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
              Execution Timeline
            </p>

            <span className="text-[10px] text-slate-700">
              {entries.length} event
              {entries.length !==
              1
                ? "s"
                : ""}
            </span>

          </div>

          <div className="space-y-2">

            {entries.map(
              (
                entry,
                index
              ) => {
                const config =
                  STATUS_CONFIG[
                    entry.status
                  ];

                const isLast =
                  index ===
                  entries.length -
                    1;

                return (
                  <div
                    key={
                      entry.id
                    }
                    className={`relative rounded-xl border p-3 transition ${getStatusClasses(
                      entry.status
                    )}`}
                  >

                    {/* Timeline connector */}
                    {!isLast && (
                      <div className="absolute bottom-[-9px] left-[25px] z-10 h-2 w-px bg-white/10" />
                    )}

                    <div className="flex items-start gap-3">

                      {/* Status icon */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${getIconClasses(
                          entry.status
                        )}`}
                      >

                        {entry.status ===
                          "complete" ||
                        entry.status ===
                          "error" ||
                        entry.status ===
                          "correcting" ? (
                          config.icon
                        ) : (
                          <Check
                            size={
                              14
                            }
                            className="text-slate-500"
                          />
                        )}

                      </div>

                      {/* Event details */}
                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <p className="text-xs font-medium text-slate-300">
                            {
                              config.label
                            }
                          </p>

                          <span className="shrink-0 font-mono text-[9px] text-slate-700">
                            {formatTime(
                              entry.timestamp
                            )}
                          </span>

                        </div>

                        <p className="mt-1 text-[11px] leading-5 text-slate-600">
                          {
                            entry.message
                          }
                        </p>

                        {entry.retryAttempt !==
                          undefined && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-500/15 bg-amber-500/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-400">

                            <RefreshCw
                              size={
                                10
                              }
                            />

                            Retry #
                            {
                              entry.retryAttempt
                            }

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>
      ) : (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-4">

          <AlertCircle
            size={15}
            className="text-slate-700"
          />

          <div>

            <p className="text-xs text-slate-600">
              Agent is ready.
            </p>

            <p className="mt-0.5 text-[10px] text-slate-700">
              Execution events will
              appear here when an
              audit starts.
            </p>

          </div>

        </div>
      )}

      {/* Completed */}
      {currentStatus ===
        "complete" && (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400">

          <Check size={13} />

          Complete audit lifecycle
          recorded.

        </div>
      )}

      {/* Error */}
      {currentStatus ===
        "error" && (
        <div className="mt-4 flex items-center gap-2 text-[11px] text-red-400">

          <X size={13} />

          Agent execution stopped.
          Manual review required.

        </div>
      )}

    </section>
  );
}