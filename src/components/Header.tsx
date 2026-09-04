import {
  Bot,
  Check,
  KeyRound,
  Server,
  ShieldCheck,
} from "lucide-react";

import type { LLMConfig } from "../types";

interface HeaderProps {
  llmConfig: LLMConfig;
  onLLMConfigChange: (
    config: LLMConfig,
  ) => void;
}

export function Header({
  llmConfig,
  onLLMConfigChange,
}: HeaderProps) {
  const hasEndpoint =
    llmConfig.endpoint.trim().length > 0;

  const hasApiKey =
    Boolean(
      llmConfig.apiKey?.trim(),
    );

  const updateConfig = (
    changes: Partial<LLMConfig>,
  ) => {
    onLLMConfigChange({
      ...llmConfig,
      ...changes,
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090d]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-4">

        {/* ==================================================
            BRAND
            ================================================== */}

        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-xl border border-indigo-500/10 bg-indigo-500/10 p-2.5">
            <Bot
              size={21}
              className="text-indigo-400"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">
                AI Finance Controller
              </h1>

              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
                Agentic Policy Engine
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-600">
              Autonomous expense compliance
            </p>
          </div>
        </div>

        {/* ==================================================
            LLM CONFIGURATION
            ================================================== */}

        <div className="hidden items-center gap-3 xl:flex">

          {/* Endpoint */}

          <div className="flex items-center gap-2">
            <Server
              size={15}
              className="text-slate-600"
            />

            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
              Endpoint
            </span>
          </div>

          <input
            type="url"
            value={
              llmConfig.endpoint
            }
            onChange={(event) =>
              updateConfig({
                endpoint:
                  event.target.value,
              })
            }
            placeholder="https://api.example.com/v1/chat/completions"
            autoComplete="off"
            spellCheck={false}
            aria-label="LLM endpoint"
            className="
              w-72
              rounded-lg
              border
              border-white/10
              bg-white/[0.03]
              px-3
              py-2
              text-xs
              text-white
              outline-none
              transition
              placeholder:text-slate-700
              hover:border-white/15
              focus:border-indigo-500/50
              focus:bg-white/[0.05]
              focus:ring-2
              focus:ring-indigo-500/10
            "
          />

          {/* Model */}

          <input
            type="text"
            value={
              llmConfig.model ?? ""
            }
            onChange={(event) =>
              updateConfig({
                model:
                  event.target.value,
              })
            }
            placeholder="Model (optional)"
            autoComplete="off"
            spellCheck={false}
            aria-label="LLM model"
            className="
              w-40
              rounded-lg
              border
              border-white/10
              bg-white/[0.03]
              px-3
              py-2
              text-xs
              text-white
              outline-none
              transition
              placeholder:text-slate-700
              hover:border-white/15
              focus:border-indigo-500/50
              focus:bg-white/[0.05]
              focus:ring-2
              focus:ring-indigo-500/10
            "
          />

          {/* API Key */}

          <div className="flex items-center gap-2">
            <KeyRound
              size={15}
              className="text-slate-600"
            />

            <input
              type="password"
              value={
                llmConfig.apiKey ?? ""
              }
              onChange={(event) =>
                updateConfig({
                  apiKey:
                    event.target.value,
                })
              }
              placeholder="API key (optional)"
              autoComplete="off"
              spellCheck={false}
              aria-label="LLM API key"
              className="
                w-48
                rounded-lg
                border
                border-white/10
                bg-white/[0.03]
                px-3
                py-2
                text-xs
                text-white
                outline-none
                transition
                placeholder:text-slate-700
                hover:border-white/15
                focus:border-indigo-500/50
                focus:bg-white/[0.05]
                focus:ring-2
                focus:ring-indigo-500/10
              "
            />

            {hasApiKey && (
              <Check
                size={14}
                className="text-emerald-400"
              />
            )}
          </div>

          {/* Status */}

          <div
            className="flex items-center gap-1.5"
            title="LLM configuration is stored locally in this browser."
          >
            <ShieldCheck
              size={12}
              className={
                hasEndpoint
                  ? "text-emerald-500/70"
                  : "text-slate-700"
              }
            />

            <span className="text-[10px] text-slate-700">
              {hasEndpoint
                ? "LLM • Configured locally"
                : "LLM • Not configured"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}