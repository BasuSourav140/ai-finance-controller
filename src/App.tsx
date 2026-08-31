import {
  useMemo,
  useState,
} from "react";

import {
  KeyRound,
  Play,
  ReceiptIndianRupee,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Header } from "./components/Header";
import { PolicyPanel } from "./components/PolicyPanel";
import { Metrics } from "./components/Metrics";
import { AuditTable } from "./components/AuditTable";
import { ResultDrawer } from "./components/ResultDrawer";

import {
  AgentActivity,
  type AgentActivityEntry,
} from "./components/AgentActivity";

import {
  processInvoice,
  type AgentEvent,
} from "./services/aiAgent";

import type {
  AgentStatus,
  AuditedInvoice,
  AuditMetrics,
} from "./types";


const API_KEY_STORAGE =
  "ai-finance-controller-gemini-key";


const SAMPLE_INVOICE = `Vendor: CloudStack Technologies
Invoice Number: CST-2026-0912
Date: 2026-08-28
Department Code: ENG-001

Description:
Annual SaaS infrastructure subscription

Subtotal: ₹4,850
Tax: ₹873

Total: ₹5,723`;


/*
 * ============================================================
 * USER-FRIENDLY ERROR MESSAGES
 * ============================================================
 *
 * Convert technical Gemini/API errors into messages
 * that make sense to someone using the controller.
 */

function getUserFriendlyError(
  error: unknown
): string {

  if (!(error instanceof Error)) {
    return "AI Agent failed. Manual review required.";
  }

  const message =
    error.message.toLowerCase();


  /*
   * Gemini quota / rate limit.
   */
  if (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes(
      "too many requests"
    )
  ) {
    return (
      "Gemini quota or rate limit reached. " +
      "The audit could not be completed. " +
      "Please try again after the quota resets."
    );
  }


  /*
   * Invalid / expired API key.
   */
  if (
    message.includes(
      "api key"
    ) ||
    message.includes(
      "authentication"
    ) ||
    message.includes(
      "unauthorized"
    ) ||
    message.includes(
      "permission"
    ) ||
    message.includes(
      "403"
    ) ||
    message.includes(
      "401"
    )
  ) {
    return (
      "Gemini API authentication failed. " +
      "Please check your API key."
    );
  }


  /*
   * Network / connection problem.
   */
  if (
    message.includes(
      "unable to reach"
    ) ||
    message.includes(
      "network"
    ) ||
    message.includes(
      "failed to fetch"
    ) ||
    message.includes(
      "connection"
    )
  ) {
    return (
      "Unable to reach the Gemini API. " +
      "Please check your internet connection and try again."
    );
  }


  /*
   * Malformed AI response after
   * the allowed self-correction attempt.
   */
  if (
    message.includes(
      "failed after"
    ) ||
    message.includes(
      "validation"
    ) ||
    message.includes(
      "invalid json"
    ) ||
    message.includes(
      "schema"
    )
  ) {
    return (
      "The AI response could not be validated after " +
      "the allowed self-correction attempt. " +
      "Manual review is required."
    );
  }


  /*
   * Empty / invalid Gemini response.
   */
  if (
    message.includes(
      "empty response"
    ) ||
    message.includes(
      "invalid api response"
    )
  ) {
    return (
      "Gemini returned an unusable response. " +
      "Please try the audit again."
    );
  }


  /*
   * Preserve application-level
   * validation messages.
   */
  if (
    message.includes(
      "invoice or receipt"
    ) ||
    message.includes(
      "api key is required"
    )
  ) {
    return error.message;
  }


  /*
   * Safe fallback.
   */
  return (
    "AI Agent failed to complete the audit. " +
    "Manual review is required."
  );
}


function App() {

  const [apiKey, setApiKey] =
  useState(() =>
    localStorage.getItem(API_KEY_STORAGE) ?? ""
  );


  const [
    invoiceText,
    setInvoiceText,
  ] = useState(
    SAMPLE_INVOICE
  );


  const [
    audits,
    setAudits,
  ] = useState<
    AuditedInvoice[]
  >([]);


  const [
    selectedInvoice,
    setSelectedInvoice,
  ] =
    useState<
      AuditedInvoice | null
    >(null);


  const [
    error,
    setError,
  ] = useState("");


  const [
    isAuditing,
    setIsAuditing,
  ] = useState(false);


  const [
    agentStatus,
    setAgentStatus,
  ] =
    useState<AgentStatus>(
      "idle"
    );


  const [
    activityEntries,
    setActivityEntries,
  ] =
    useState<
      AgentActivityEntry[]
    >([]);


  /*
   * ==========================================================
   * RESTORE SAVED API KEY
   * ==========================================================
   */

  


  /*
   * ==========================================================
   * API KEY CHANGE
   * ==========================================================
   */

  const handleApiKeyChange = (
    value: string
  ) => {

    setApiKey(value);


    localStorage.setItem(
      API_KEY_STORAGE,
      value
    );
  };


  /*
   * ==========================================================
   * DASHBOARD METRICS
   * ==========================================================
   */

  const metrics: AuditMetrics =
    useMemo(() => {

      return audits.reduce(
        (
          result,
          invoice
        ) => {

          result.totalAmount +=
            invoice.total_amount;


          if (
            invoice.policy_violation
          ) {

            result.violationCount +=
              1;

          } else {

            result.cleanCount +=
              1;
          }


          return result;

        },
        {
          totalAmount: 0,
          violationCount: 0,
          cleanCount: 0,
        }
      );

    }, [audits]);


  /*
   * ==========================================================
   * ADD AGENT ACTIVITY
   * ==========================================================
   */

  const addActivity = (
    status: AgentStatus,
    message: string,
    retryAttempt?: number
  ) => {

    const entry:
      AgentActivityEntry = {

      id:
        crypto.randomUUID(),

      status,

      message,

      retryAttempt,

      timestamp:
        new Date().toISOString(),
    };


    setActivityEntries(
      (
        current
      ) => [
        ...current,
        entry,
      ]
    );
  };


  /*
   * ==========================================================
   * RECEIVE AGENT EVENTS
   * ==========================================================
   */

  const handleAgentEvent = (
    event: AgentEvent
  ) => {

    if (
      event.type ===
      "status"
    ) {

      setAgentStatus(
        event.status
      );


      addActivity(
        event.status,
        event.message
      );


      return;
    }


    if (
      event.type ===
      "retry"
    ) {

      setAgentStatus(
        "correcting"
      );


      addActivity(
        "correcting",
        event.message,
        event.attempt
      );
    }
  };


  /*
   * ==========================================================
   * RUN AUDIT
   * ==========================================================
   */

  const handleAudit =
    async () => {

      setError("");


      /*
       * Validate API key.
       */

      if (!apiKey.trim()) {

        const message =
          "Please enter your Gemini API key.";


        setError(
          message
        );


        setAgentStatus(
          "error"
        );


        setActivityEntries([
          {
            id:
              crypto.randomUUID(),

            status:
              "error",

            message:
              "Gemini API key is required.",

            timestamp:
              new Date().toISOString(),
          },
        ]);


        return;
      }


      /*
       * Validate document.
       */

      if (!invoiceText.trim()) {

        const message =
          "Please provide invoice or receipt data.";


        setError(
          message
        );


        setAgentStatus(
          "error"
        );


        setActivityEntries([
          {
            id:
              crypto.randomUUID(),

            status:
              "error",

            message:
              "Invoice or receipt data is required.",

            timestamp:
              new Date().toISOString(),
          },
        ]);


        return;
      }


      /*
       * Start audit.
       */

      setIsAuditing(
        true
      );


      setError("");


      /*
       * Clear previous execution timeline.
       */

      setActivityEntries([]);


      try {

        /*
         * Execute complete AI
         * Finance Controller pipeline.
         */

        const result =
          await processInvoice(
            invoiceText,
            apiKey,
            handleAgentEvent
          );


        /*
         * Convert result into
         * auditable transaction.
         */

        const auditedInvoice:
          AuditedInvoice = {

          ...result,

          id:
            crypto.randomUUID(),

          raw_input:
            invoiceText,

          audited_at:
            new Date().toISOString(),
        };


        /*
         * Add newest audit first.
         */

        setAudits(
          (
            currentAudits
          ) => [
            auditedInvoice,
            ...currentAudits,
          ]
        );


      } catch (error) {

        console.error(
          "AI Finance Controller audit failed:",
          error
        );


        /*
         * Convert technical errors
         * into safe user-facing messages.
         */

        const message =
          getUserFriendlyError(
            error
          );


        setAgentStatus(
          "error"
        );


        setError(
          message
        );


        addActivity(
          "error",
          message
        );


      } finally {

        setIsAuditing(
          false
        );
      }
    };


  return (
    <div className="min-h-screen bg-[#07090d] text-slate-200">

      {/* ====================================================
          AMBIENT BACKGROUND
          ==================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-1/4 top-[-200px] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />

        <div className="absolute right-[-100px] top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[130px]" />

      </div>


      {/* ====================================================
          HEADER
          ==================================================== */}

      <Header
        apiKey={
          apiKey
        }

        onApiKeyChange={
          handleApiKeyChange
        }
      />


      <main className="relative mx-auto max-w-[1600px] px-6 py-8">

        {/* ==================================================
            PAGE INTRODUCTION
            ================================================== */}

        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs text-indigo-400">

              <Sparkles
                size={13}
              />

              AI-powered financial controls

            </div>


            <h2 className="text-2xl font-bold tracking-tight text-white">
              Expense Audit Command Center
            </h2>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">

              Extract transaction data,
              enforce company policy,
              identify financial risk,
              and generate actionable
              recommendations automatically.

            </p>

          </div>


          <div className="flex items-center gap-2 text-xs text-slate-600">

            <ShieldCheck
              size={14}
            />

            Policy engine active

          </div>

        </div>


        {/* ==================================================
            METRICS
            ================================================== */}

        <Metrics
          metrics={
            metrics
          }
        />


        {/* ==================================================
            WORKSPACE
            ================================================== */}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">

          {/* Policy sidebar */}

          <PolicyPanel />


          {/* Main content */}

          <div className="space-y-6">

            {/* =================================================
                DOCUMENT INPUT
                ================================================= */}

            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">

              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-white/5 p-2">

                  <ReceiptIndianRupee
                    size={17}
                    className="text-slate-300"
                  />

                </div>


                <div>

                  <h3 className="text-sm font-semibold text-white">
                    Transaction Document
                  </h3>


                  <p className="text-xs text-slate-600">
                    Paste an invoice, receipt,
                    or expense data.
                  </p>

                </div>

              </div>


              <textarea
                value={
                  invoiceText
                }

                onChange={(
                  event
                ) =>
                  setInvoiceText(
                    event.target.value
                  )
                }

                spellCheck={
                  false
                }

                className="mt-5 min-h-[240px] w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-sm leading-6 text-slate-300 outline-none placeholder:text-slate-700 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10"

                placeholder="Paste invoice or receipt information here..."
              />


              {/* Error */}

              {error && (

                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-5 text-red-300">

                  {error}

                </div>

              )}


              <div className="mt-4 flex items-center justify-between">

                <div className="hidden items-center gap-2 text-xs text-slate-700 sm:flex">

                  <KeyRound
                    size={13}
                  />

                  Gemini API key required

                </div>


                <button
                  type="button"

                  onClick={
                    handleAudit
                  }

                  disabled={
                    isAuditing
                  }

                  className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {isAuditing ? (

                    <>

                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      AI Agent Auditing...

                    </>

                  ) : (

                    <>

                      <Play
                        size={15}
                      />

                      Run Audit

                    </>

                  )}

                </button>

              </div>

            </section>


            {/* =================================================
                AGENT TIMELINE
                ================================================= */}

            <AgentActivity
              entries={
                activityEntries
              }

              currentStatus={
                agentStatus
              }
            />


            {/* =================================================
                AUDIT RESULTS
                ================================================= */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <h3 className="text-sm font-semibold text-white">
                    Audit Results
                  </h3>


                  <p className="mt-1 text-xs text-slate-600">
                    AI extraction and
                    policy decisions
                  </p>

                </div>


                <span className="text-xs text-slate-600">

                  {audits.length}
                  {" "}
                  transaction
                  {audits.length !==
                  1
                    ? "s"
                    : ""}

                </span>

              </div>


              <AuditTable
                invoices={
                  audits
                }

                onSelect={
                  setSelectedInvoice
                }
              />

            </section>

          </div>

        </div>

      </main>


      {/* ====================================================
          RESULT DRAWER
          ==================================================== */}

      <ResultDrawer
        invoice={
          selectedInvoice
        }

        onClose={() =>
          setSelectedInvoice(
            null
          )
        }
      />

    </div>
  );
}


export default App;