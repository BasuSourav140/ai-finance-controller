import type {
  RiskLevel,
} from "../types";

export function generateRecommendation(
  violations: string[],
  riskLevel: RiskLevel
): string {
  if (riskLevel === "CRITICAL") {
    return "Block automatic approval and route this transaction for manual finance review.";
  }

  if (violations.length === 0) {
    return "Approve automatically. Transaction complies with current company policy.";
  }

  if (
    violations.some((violation) =>
      violation.includes("Meal")
    )
  ) {
    return "Request an itemized receipt and obtain manager approval before reimbursement.";
  }

  if (
    violations.some((violation) =>
      violation.includes("Software")
    )
  ) {
    return "Request the missing department code and verify the software purchase with IT.";
  }

  return "Route transaction for manual finance review before approval.";
}