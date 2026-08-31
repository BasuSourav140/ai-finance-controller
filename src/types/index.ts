export type PolicyStatus =
  | "PASS"
  | "FAIL";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type AgentStatus =
  | "idle"
  | "extracting"
  | "validating"
  | "correcting"
  | "evaluating"
  | "complete"
  | "error";


/*
 * ============================================================
 * POLICY VIOLATION
 * ============================================================
 *
 * Represents a specific deterministic policy failure.
 */

export interface PolicyViolation {
  policy_id: string;
  policy_name: string;
  message: string;
}


/*
 * ============================================================
 * INVOICE RESULT
 * ============================================================
 */

export interface InvoiceResult {
  vendor_name: string;

  total_amount: number;

  category: string;

  policy_violation: boolean;

  /*
   * Human-readable policy violation
   * messages used by the existing UI.
   */
  violation_details: string[];

  /*
   * Structured policy violations.
   *
   * Example:
   *
   * {
   *   policy_id: "P-001",
   *   policy_name: "Meal Expense Limit",
   *   message: "Meal expense exceeds ₹3,000 limit."
   * }
   */
  violations: PolicyViolation[];

  strategic_recommendation: string;

  invoice_date: string;

  department_code: string;

  risk_level: RiskLevel;
}


/*
 * ============================================================
 * AUDITED INVOICE
 * ============================================================
 */

export interface AuditedInvoice
  extends InvoiceResult {
  id: string;

  raw_input: string;

  audited_at: string;
}


/*
 * ============================================================
 * AUDIT METRICS
 * ============================================================
 */

export interface AuditMetrics {
  totalAmount: number;

  violationCount: number;

  cleanCount: number;
}


/*
 * ============================================================
 * BATCH EVALUATION
 * ============================================================
 *
 * Types used by the synthetic-data evaluation system.
 *
 * The evaluator compares the application's actual audit
 * decision against a known ground-truth decision.
 */


/*
 * ------------------------------------------------------------
 * SYNTHETIC TRANSACTION
 * ------------------------------------------------------------
 *
 * Represents one controlled test record.
 */

export interface SyntheticTransaction {
  id: string;

  raw_input: string;

  expected_policy_status: PolicyStatus;

  expected_risk_level: RiskLevel;

  expected_policy_ids: string[];
}


/*
 * ------------------------------------------------------------
 * BATCH EVALUATION RESULT
 * ------------------------------------------------------------
 *
 * Represents the result of auditing one synthetic record.
 */

export interface BatchEvaluationResult {
  transaction_id: string;

  expected_policy_status: PolicyStatus;

  actual_policy_status: PolicyStatus;

  expected_risk_level: RiskLevel;

  actual_risk_level: RiskLevel;

  expected_policy_ids: string[];

  actual_policy_ids: string[];

  matched: boolean;

  result?: AuditedInvoice;

  error?: string;
}


/*
 * ------------------------------------------------------------
 * BATCH EVALUATION METRICS
 * ------------------------------------------------------------
 */

export interface BatchEvaluationMetrics {
  total_records: number;

  processed_records: number;

  matched_records: number;

  exception_count: number;

  match_rate: number;

  policy_violation_count: number;

  clean_transaction_count: number;

  exceptions: BatchEvaluationResult[];
}


/*
 * ------------------------------------------------------------
 * BATCH EVALUATION
 * ------------------------------------------------------------
 *
 * Complete output produced by the batch evaluator.
 */

export interface BatchEvaluation {
  metrics: BatchEvaluationMetrics;

  results: BatchEvaluationResult[];

  evaluated_at: string;
}