import {
  Bot,
  Check,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

interface HeaderProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
}

export function Header({
  apiKey,
  onApiKeyChange,
}: HeaderProps) {
  const hasApiKey =
    apiKey.trim().length > 0;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090d]/85 backdrop-blur-xl">

      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-4">

        {/* Brand */}
        <div className="flex min-w-0 items-center gap-3">

          {/* Logo */}
          <div className="shrink-0 rounded-xl border border-indigo-500/10 bg-indigo-500/10 p-2.5">

            <Bot
              size={21}
              className="text-indigo-400"
            />

          </div>

          {/* Brand text */}
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


        {/* API Key section */}
        <div className="hidden items-center gap-3 md:flex">

          {/* API key label */}
          <div className="flex items-center gap-2">

            <KeyRound
              size={15}
              className="text-slate-600"
            />

            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
              Gemini API • BYOK
            </span>

          </div>


          {/* Input */}
          <div className="relative">

            <input
              type="password"
              value={apiKey}
              onChange={(event) =>
                onApiKeyChange(
                  event.target.value
                )
              }
              placeholder="Paste API key"
              autoComplete="off"
              spellCheck={false}
              aria-label="Gemini API key"
              className="
                w-64
                rounded-lg
                border
                border-white/10
                bg-white/[0.03]
                px-3
                py-2
                pr-9
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


            {/* Key status */}
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">

              {hasApiKey ? (
                <Check
                  size={14}
                  className="text-emerald-400"
                />
              ) : (
                <KeyRound
                  size={13}
                  className="text-slate-700"
                />
              )}

            </div>

          </div>


          {/* BYOK storage indicator */}
          <div
            className="flex items-center gap-1.5"
            title="Your Gemini API key is stored locally in this browser."
          >

            <ShieldCheck
              size={12}
              className={
                hasApiKey
                  ? "text-emerald-500/70"
                  : "text-slate-700"
              }
            />

            <span className="text-[10px] text-slate-700">
              BYOK • Stored locally
            </span>

          </div>

        </div>

      </div>

    </header>
  );
}