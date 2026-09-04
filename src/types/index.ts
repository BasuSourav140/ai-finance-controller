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
 * LLM CONFIGURATION
 * ============================================================
 */

export interface LLMConfig {
  /*
   * User-provided inference endpoint.
   */
  endpoint: string;

  /*
   * Optional API credential.
   *
   * Local/self-hosted models may not require one.
   */
  apiKey?: string;

  /*
   * Optional model identifier.
   */
  model?: string;
}


/*
 * ============================================================
 * EXTRACTED INVOICE FACTS
 * ============================================================
 *
 * These are the ONLY facts the LLM is responsible for
 * extracting.
 *
 * Policy decisions are intentionally excluded.
 */

export interface ExtractedInvoiceFacts {
  vendor_name: string;
  total_amount: number;
  category: string;
  invoice_date: string;
  department_code: string;
}


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
 *
 * Final application-level result.
 *
 * Extracted facts come from the LLM.
 * Compliance, violations and risk come from deterministic
 * application logic.
 */

export interface InvoiceResult {
  vendor_name: string;
  total_amount: number;
  category: string;

  policy_violation: boolean;

  violation_details: string[];

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
 */

export interface SyntheticTransaction {
  id: string;

  raw_input: string;

  expected_policy_status: PolicyStatus;

  expected_risk_level: RiskLevel;

  expected_policy_ids: string[];
}


export interface BatchEvaluationResult {
  transaction_id: string;

  expected_policy_status: PolicyStatus;

  actual_policy_status?: PolicyStatus;

  expected_risk_level: RiskLevel;

  actual_risk_level?: RiskLevel;

  expected_policy_ids: string[];

  actual_policy_ids?: string[];

  matched: boolean;

  result?: InvoiceResult;

  error?: string;
}


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


export interface BatchEvaluation {
  metrics: BatchEvaluationMetrics;

  results: BatchEvaluationResult[];

  evaluated_at: string;
}