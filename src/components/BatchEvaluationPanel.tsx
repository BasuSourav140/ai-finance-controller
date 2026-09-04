import {
  useState,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  evaluateBatch,
} from "../services/batchEvaluator";

import {
  EVALUATION_DATASET,
} from "../data/evaluationDataset";

import type {
  BatchEvaluation,
  BatchEvaluationResult,
  LLMConfig,
} from "../types";


interface BatchEvaluationPanelProps {
  llmConfig: LLMConfig;
  disabled?: boolean;
}


export function BatchEvaluationPanel({
  llmConfig,
  disabled = false,
}: BatchEvaluationPanelProps) {

  const [
    evaluation,
    setEvaluation,
  ] = useState<BatchEvaluation | null>(null);

  const [
    isRunning,
    setIsRunning,
  ] = useState(false);

  const [
    progress,
    setProgress,
  ] = useState({
    completed: 0,
    total: 0,
  });

  const [
    error,
    setError,
  ] = useState("");


  const runEvaluation = async (
    recordCount: number,
  ) => {

    if (!llmConfig.endpoint.trim()) {
      setError(
        "Please configure an LLM endpoint before running a batch evaluation.",
      );
      return;
    }


    setIsRunning(true);
    setError("");
    setEvaluation(null);
    setProgress({
      completed: 0,
      total: recordCount,
    });


    try {

      const dataset =
        EVALUATION_DATASET.slice(
          0,
          recordCount,
        );


      const result =
        await evaluateBatch(
          dataset,
          {
            llmConfig,

            onProgress: (
              completed,
              total,
            ) => {
              setProgress({
                completed,
                total,
              });
            },
          },
        );


      setEvaluation(result);

    } catch (evaluationError) {

      const message =
        evaluationError instanceof Error
          ? evaluationError.message
          : "Batch evaluation failed.";

      setError(message);

    } finally {

      setIsRunning(false);
    }
  };


  const metrics =
    evaluation?.metrics;


  const exceptions =
    evaluation?.metrics.exceptions ?? [];


  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex items-start gap-3">

          <div className="rounded-lg bg-white/5 p-2">

            <Database
              size={17}
              className="text-slate-300"
            />

          </div>

          <div>

            <h3 className="text-sm font-semibold text-white">
              Batch Evaluation
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
              Measure controller accuracy against the synthetic
              finance-operations dataset and surface unresolved exceptions.
            </p>

          </div>

        </div>


        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() => {
              void runEvaluation(3);
            }}
            disabled={
              isRunning ||
              disabled
            }
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {isRunning &&
            progress.total === 3 ? (
              <RefreshCw
                size={13}
                className="animate-spin"
              />
            ) : (
              <Play size={13} />
            )}

            Test 3 Records

          </button>


          <button
            type="button"
            onClick={() => {
              void runEvaluation(
                EVALUATION_DATASET.length,
              );
            }}
            disabled={
              isRunning ||
              disabled
            }
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {isRunning &&
            progress.total ===
              EVALUATION_DATASET.length ? (
              <RefreshCw
                size={13}
                className="animate-spin"
              />
            ) : (
              <ShieldCheck size={13} />
            )}

            Run Full Benchmark

          </button>

        </div>

      </div>


      {isRunning && (

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">

          <div className="flex items-center justify-between text-xs">

            <span className="text-slate-400">
              Processing synthetic transactions
            </span>

            <span className="font-mono text-slate-300">
              {progress.completed}
              {" / "}
              {progress.total}
            </span>

          </div>


          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">

            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-300"
              style={{
                width:
                  progress.total === 0
                    ? "0%"
                    : `${(
                        progress.completed /
                        progress.total
                      ) * 100}%`,
              }}
            />

          </div>

        </div>

      )}


      {error && (

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs leading-5 text-red-300">

          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0"
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {metrics && (

        <>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">

            <MetricCard
              label="Records"
              value={`${metrics.processed_records}/${metrics.total_records}`}
              icon={<Database size={14} />}
            />

            <MetricCard
              label="Match Rate"
              value={`${metrics.match_rate.toFixed(2)}%`}
              icon={<CheckCircle2 size={14} />}
            />

            <MetricCard
              label="Matched"
              value={metrics.matched_records}
              icon={<ShieldCheck size={14} />}
            />

            <MetricCard
              label="Exceptions"
              value={metrics.exception_count}
              icon={<AlertTriangle size={14} />}
            />

            <MetricCard
              label="Clean"
              value={metrics.clean_transaction_count}
              icon={<Clock3 size={14} />}
            />

          </div>


          <div className="mt-5 flex flex-col gap-2 border-t border-white/5 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">

            <div className="text-slate-600">
              Policy violations detected:
              {" "}
              <span className="text-slate-400">
                {metrics.policy_violation_count}
              </span>
            </div>

            {evaluation?.evaluated_at && (

              <div className="font-mono text-slate-700">
                {new Date(
                  evaluation.evaluated_at,
                ).toLocaleString()}
              </div>

            )}

          </div>


          {exceptions.length > 0 ? (

            <div className="mt-5 overflow-hidden rounded-xl border border-white/10">

              <div className="border-b border-white/10 bg-black/20 px-4 py-3">

                <div className="text-xs font-semibold text-white">
                  Unresolved Exceptions
                </div>

                <div className="mt-1 text-[11px] text-slate-600">
                  Records where the controller output did not
                  fully match the expected ground truth.
                </div>

              </div>


              <div className="divide-y divide-white/5">

                {exceptions.map(
                  (
                    exception,
                  ) => (
                    <ExceptionRow
                      key={
                        exception.transaction_id
                      }
                      exception={
                        exception
                      }
                    />
                  ),
                )}

              </div>

            </div>

          ) : (

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">

              <CheckCircle2 size={14} />

              All evaluated records matched the expected ground truth.

            </div>

          )}

        </>

      )}

    </section>
  );
}


interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
}


function MetricCard({
  label,
  value,
  icon,
}: MetricCardProps) {

  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-3">

      <div className="flex items-center gap-2 text-[11px] text-slate-600">

        {icon}

        {label}

      </div>

      <div className="mt-1 text-lg font-semibold text-white">
        {value}
      </div>

    </div>
  );
}


interface ExceptionRowProps {
  exception: BatchEvaluationResult;
}


function ExceptionRow({
  exception,
}: ExceptionRowProps) {

  const actualStatus =
    exception.actual_policy_status ??
    "ERROR";

  const actualRisk =
    exception.actual_risk_level ??
    "ERROR";

  const actualPolicies =
    exception.actual_policy_ids?.length
      ? exception.actual_policy_ids.join(", ")
      : "—";


  return (
    <div className="grid gap-3 px-4 py-3 text-xs md:grid-cols-[90px_1fr_1fr_1fr] md:items-center">

      <div className="font-mono font-semibold text-slate-400">
        {exception.transaction_id}
      </div>


      <div>

        <div className="text-slate-600">
          Expected
        </div>

        <div className="mt-1 text-slate-300">
          {exception.expected_policy_status}
          {" · "}
          {exception.expected_risk_level}
          {" · "}
          {exception.expected_policy_ids.length
            ? exception.expected_policy_ids.join(", ")
            : "No policy"}
        </div>

      </div>


      <div>

        <div className="text-slate-600">
          Actual
        </div>

        <div className="mt-1 text-slate-300">
          {actualStatus}
          {" · "}
          {actualRisk}
          {" · "}
          {actualPolicies}
        </div>

      </div>


      <div className="text-slate-500">

        {exception.error
          ? exception.error
          : "Controller output differed from expected ground truth."}

      </div>

    </div>
  );
}
