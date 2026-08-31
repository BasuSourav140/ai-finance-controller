import type {
  InvoiceResult,
  RiskLevel,
} from "../types";

/*
 * ============================================================
 * POLICY REGISTRY
 * ============================================================
 *
 * These are the deterministic policies enforced by the
 * Finance Controller.
 *
 * The AI agent does NOT decide whether a policy is violated.
 * The policy engine makes that decision deterministically.
 */

export interface PolicyDefinition {
  id: string;
  name: string;
  description: string;
}

export const POLICY_REGISTRY:
  PolicyDefinition[] = [
  {
    id: "P-001",
    name: "Meal Expense Limit",
    description:
      "Meal expenses above ₹3,000 require review.",
  },

  {
    id: "P-002",
    name: "SaaS Department Code",
    description:
      "Software/SaaS expenses must contain a department code.",
  },

  {
    id: "P-003",
    name: "Invoice Date Requirement",
    description:
      "Every invoice must contain an invoice date.",
  },
];


/*
 * ============================================================
 * POLICY VIOLATION
 * ============================================================
 *
 * Represents one deterministic policy failure.
 */
export interface PolicyViolation {
  policy_id: string;
  policy_name: string;
  message: string;
}


/*
 * ============================================================
 * POLICY EVALUATION RESULT
 * ============================================================
 */

export interface PolicyEvaluation {
  policy_violation: boolean;

  violation_details: string[];

  violations: PolicyViolation[];

  risk_level: RiskLevel;
}


/*
 * ============================================================
 * POLICY ENGINE
 * ============================================================
 */

export function evaluatePolicy(
  invoice: InvoiceResult
): PolicyEvaluation {

  const violations:
    PolicyViolation[] = [];


  const category =
    invoice.category
      .trim()
      .toLowerCase();


  /*
   * ==========================================================
   * P-001
   *
   * Meal expenses above ₹3,000
   * require review.
   * ==========================================================
   */

  if (
    category.includes("meal") &&
    invoice.total_amount > 3000
  ) {

    violations.push({
      policy_id: "P-001",

      policy_name:
        "Meal Expense Limit",

      message:
        `Meal expense of ₹${invoice.total_amount.toLocaleString(
          "en-IN"
        )} exceeds the ₹3,000 limit.`,
    });
  }


  /*
   * ==========================================================
   * P-002
   *
   * Software/SaaS expenses must have
   * a department code.
   * ==========================================================
   */

  const isSoftwareExpense =
    category.includes("software") ||
    category.includes("saas");


  if (
    isSoftwareExpense &&
    !invoice.department_code.trim()
  ) {

    violations.push({
      policy_id: "P-002",

      policy_name:
        "SaaS Department Code",

      message:
        "Software/SaaS expense is missing the required department code.",
    });
  }


  /*
   * ==========================================================
   * P-003
   *
   * Every invoice must have a date.
   * ==========================================================
   */

  if (
    !invoice.invoice_date.trim()
  ) {

    violations.push({
      policy_id: "P-003",

      policy_name:
        "Invoice Date Requirement",

      message:
        "Invoice date is missing. This is a critical compliance issue.",
    });
  }


  /*
   * ==========================================================
   * RISK CALCULATION
   * ==========================================================
   */

  let riskLevel: RiskLevel =
    "LOW";


  const hasCriticalViolation =
    violations.some(
      (violation) =>
        violation.policy_id ===
        "P-003"
    );


  if (
    hasCriticalViolation
  ) {

    riskLevel =
      "CRITICAL";

  } else if (
    violations.length >= 2
  ) {

    riskLevel =
      "HIGH";

  } else if (
    violations.length === 1
  ) {

    riskLevel =
      "MEDIUM";
  }


  /*
   * ==========================================================
   * LEGACY COMPATIBILITY
   * ==========================================================
   *
   * violation_details remains a string[]
   * so the existing UI and recommendation
   * engine continue to work.
   */

  const violationDetails =
    violations.map(
      (violation) =>
        `${violation.policy_id} — ${violation.policy_name}: ${violation.message}`
    );


  /*
   * ==========================================================
   * FINAL RESULT
   * ==========================================================
   */

  return {

    policy_violation:
      violations.length > 0,

    violation_details:
      violationDetails,

    violations,

    risk_level:
      riskLevel,
  };
}