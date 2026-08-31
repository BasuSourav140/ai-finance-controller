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