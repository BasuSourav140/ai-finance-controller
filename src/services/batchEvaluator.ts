import type {
  InvoiceResult,
  BatchEvaluation,
  BatchEvaluationMetrics,
  BatchEvaluationResult,
  SyntheticTransaction,
  LLMConfig,
} from "../types";

import {
  processInvoice,
} from "./aiAgent";


export interface BatchEvaluationOptions {

  llmConfig: LLMConfig;

  onProgress?: (
    completed: number,
    total: number,
  ) => void;
}


/*
 * ============================================================
 * POLICY ID NORMALIZATION
 * ============================================================
 */

function normalizePolicyIds(
  policyIds: string[],
): string[] {

  return [
    ...policyIds,
  ].sort();
}


/*
 * ============================================================
 * POLICY ID COMPARISON
 * ============================================================
 */

function policyIdsMatch(
  expected: string[],
  actual: string[],
): boolean {

  const normalizedExpected =
    normalizePolicyIds(
      expected,
    );

  const normalizedActual =
    normalizePolicyIds(
      actual,
    );


  if (
    normalizedExpected.length !==
    normalizedActual.length
  ) {

    return false;
  }


  return normalizedExpected.every(
    (
      policyId,
      index,
    ) =>
      policyId ===
      normalizedActual[index],
  );
}


/*
 * ============================================================
 * COMPARE RESULT
 * ============================================================
 */

function compareResult(
  transaction: SyntheticTransaction,
  result: InvoiceResult,
): boolean {

  const actualPolicyStatus =
    result.policy_violation
      ? "FAIL"
      : "PASS";


  const actualPolicyIds =
    result.violations.map(
      (
        violation,
      ) =>
        violation.policy_id,
    );


  return (
    actualPolicyStatus ===
      transaction.expected_policy_status &&

    result.risk_level ===
      transaction.expected_risk_level &&

    policyIdsMatch(
      transaction.expected_policy_ids,
      actualPolicyIds,
    )
  );
}


/*
 * ============================================================
 * BATCH EVALUATION
 * ============================================================
 */

export async function evaluateBatch(
  transactions: SyntheticTransaction[],
  options: BatchEvaluationOptions,
): Promise<BatchEvaluation> {

  if (
    transactions.length === 0
  ) {

    throw new Error(
      "Cannot evaluate an empty dataset.",
    );
  }


  if (
    !options.llmConfig.endpoint.trim()
  ) {

    throw new Error(
      "An LLM endpoint is required for batch evaluation.",
    );
  }


  const results:
    BatchEvaluationResult[] = [];


  let processedRecords = 0;

  let matchedRecords = 0;

  let policyViolationCount = 0;

  let cleanTransactionCount = 0;


  /*
   * Sequential processing is intentional.
   *
   * It avoids sending a burst of simultaneous requests
   * to the user's LLM endpoint.
   */

  for (
    const transaction of transactions
  ) {

    try {

      const result =
        await processInvoice(
          transaction.raw_input,
          options.llmConfig,
        );


      const matched =
        compareResult(
          transaction,
          result,
        );


      const actualPolicyStatus =
        result.policy_violation
          ? "FAIL"
          : "PASS";


      const actualPolicyIds =
        result.violations.map(
          (
            violation,
          ) =>
            violation.policy_id,
        );


      if (
        result.policy_violation
      ) {

        policyViolationCount++;

      } else {

        cleanTransactionCount++;
      }


      if (matched) {

        matchedRecords++;
      }


      results.push({

        transaction_id:
          transaction.id,

        expected_policy_status:
          transaction.expected_policy_status,

        actual_policy_status:
          actualPolicyStatus,

        expected_risk_level:
          transaction.expected_risk_level,

        actual_risk_level:
          result.risk_level,

        expected_policy_ids:
          transaction.expected_policy_ids,

        actual_policy_ids:
          actualPolicyIds,

        matched,

        result,
      });

    } catch (
      error
    ) {

      const message =
        error instanceof Error
          ? error.message
          : "Unknown evaluation error.";


      results.push({

        transaction_id:
          transaction.id,

        expected_policy_status:
          transaction.expected_policy_status,

        expected_risk_level:
          transaction.expected_risk_level,

        expected_policy_ids:
          transaction.expected_policy_ids,

        matched:
          false,

        error:
          message,
      });
    }


    processedRecords++;


    options.onProgress?.(
      processedRecords,
      transactions.length,
    );
  }


  /*
   * Any mismatch or processing failure is an exception.
   */

  const exceptionResults =
    results.filter(
      (
        result,
      ) =>
        !result.matched,
    );


  const matchRate =
    processedRecords === 0
      ? 0
      : (
          matchedRecords /
          processedRecords
        ) * 100;


  const metrics:
    BatchEvaluationMetrics = {

    total_records:
      transactions.length,

    processed_records:
      processedRecords,

    matched_records:
      matchedRecords,

    exception_count:
      exceptionResults.length,

    match_rate:
      Number(
        matchRate.toFixed(2),
      ),

    policy_violation_count:
      policyViolationCount,

    clean_transaction_count:
      cleanTransactionCount,

    exceptions:
      exceptionResults,
  };


  return {

    metrics,

    results,

    evaluated_at:
      new Date().toISOString(),
  };
}