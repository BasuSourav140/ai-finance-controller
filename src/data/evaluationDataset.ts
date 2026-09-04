import type {
  PolicyStatus,
  RiskLevel,
  SyntheticTransaction,
} from "../types";

/*
 * ============================================================
 * SYNTHETIC EVALUATION DATASET
 * ============================================================
 *
 * Controlled transactions with deterministic ground truth.
 *
 * These records are intentionally designed to exercise:
 *
 * P-001 — Meal Expense Limit
 * P-002 — SaaS Department Code
 * P-003 — Invoice Date Requirement
 *
 * The expected result is defined independently of Gemini.
 * The batch evaluator will compare the controller's actual
 * result against this ground truth.
 */


/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function transaction(
  id: string,
  raw_input: string,
  expected_policy_status: PolicyStatus,
  expected_risk_level: RiskLevel,
  expected_policy_ids: string[],
): SyntheticTransaction {
  return {
    id,
    raw_input,
    expected_policy_status,
    expected_risk_level,
    expected_policy_ids,
  };
}


/*
 * ============================================================
 * DATASET
 * ============================================================
 */

export const EVALUATION_DATASET:
  SyntheticTransaction[] = [

  /*
   * ----------------------------------------------------------
   * CLEAN TRANSACTIONS
   * ----------------------------------------------------------
   */

  transaction(
    "TX-001",
    `
Vendor: CloudStack Technologies
Category: SaaS
Total: ₹5,723
Invoice Date: 2026-08-28
Department Code: ENG-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-002",
    `
Vendor: Office Supplies India
Category: Office Supplies
Total: ₹1,850
Invoice Date: 2026-08-27
Department Code: OPS-002
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-003",
    `
Vendor: Royal Kitchen
Category: Meal
Total: ₹2,450
Invoice Date: 2026-08-29
Department Code: HR-002
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-004",
    `
Vendor: DevTools Cloud
Category: Software
Total: ₹8,400
Invoice Date: 2026-08-26
Department Code: ENG-003
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-005",
    `
Vendor: Metro Transport
Category: Transportation
Total: ₹3,200
Invoice Date: 2026-08-25
Department Code: FIN-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-006",
    `
Vendor: Business Lunch Co
Category: Meal
Total: ₹3,000
Invoice Date: 2026-08-24
Department Code: SALES-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-007",
    `
Vendor: Design Suite
Category: SaaS
Total: ₹2,999
Invoice Date: 2026-08-23
Department Code: DESIGN-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-008",
    `
Vendor: Travel Desk
Category: Travel
Total: ₹12,500
Invoice Date: 2026-08-22
Department Code: SALES-002
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-009",
    `
Vendor: Internet Services Ltd
Category: Utilities
Total: ₹4,100
Invoice Date: 2026-08-21
Department Code: IT-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-010",
    `
Vendor: Conference Center
Category: Event
Total: ₹18,000
Invoice Date: 2026-08-20
Department Code: HR-003
    `,
    "PASS",
    "LOW",
    [],
  ),


  /*
   * ----------------------------------------------------------
   * P-001 — MEAL EXPENSE LIMIT
   * ----------------------------------------------------------
   */

  transaction(
    "TX-011",
    `
Vendor: Royal Kitchen
Category: Meal
Total: ₹3,001
Invoice Date: 2026-08-19
Department Code: HR-002
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-012",
    `
Vendor: Executive Dining
Category: Meal
Total: ₹4,720
Invoice Date: 2026-08-18
Department Code: EXEC-001
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-013",
    `
Vendor: Business Bistro
Category: Meal
Total: ₹5,500
Invoice Date: 2026-08-17
Department Code: SALES-004
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-014",
    `
Vendor: Corporate Catering
Category: Meal
Total: ₹3,750
Invoice Date: 2026-08-16
Department Code: HR-004
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-015",
    `
Vendor: Team Dinner
Category: Meal
Total: ₹6,250
Invoice Date: 2026-08-15
Department Code: ENG-004
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-016",
    `
Vendor: Client Dinner
Category: Meal
Total: ₹9,999
Invoice Date: 2026-08-14
Department Code: SALES-005
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-017",
    `
Vendor: Restaurant Group
Category: Meals and Entertainment
Total: ₹4,100
Invoice Date: 2026-08-13
Department Code: MKT-001
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-018",
    `
Vendor: Food Services
Category: Meal Expense
Total: ₹3,250
Invoice Date: 2026-08-12
Department Code: OPS-003
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),


  /*
   * ----------------------------------------------------------
   * P-002 — SAAS DEPARTMENT CODE
   * ----------------------------------------------------------
   */

  transaction(
    "TX-019",
    `
Vendor: CloudStack Technologies
Category: SaaS
Total: ₹5,723
Invoice Date: 2026-08-11
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-020",
    `
Vendor: DevTools Cloud
Category: Software
Total: ₹8,400
Invoice Date: 2026-08-10
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-021",
    `
Vendor: Analytics Platform
Category: SaaS
Total: ₹12,000
Invoice Date: 2026-08-09
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-022",
    `
Vendor: Code Hosting Service
Category: Software
Total: ₹4,500
Invoice Date: 2026-08-08
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-023",
    `
Vendor: Project Management Cloud
Category: SaaS
Total: ₹7,200
Invoice Date: 2026-08-07
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-024",
    `
Vendor: Security Platform
Category: Software Services
Total: ₹15,500
Invoice Date: 2026-08-06
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),


  /*
   * ----------------------------------------------------------
   * P-003 — INVOICE DATE REQUIREMENT
   * ----------------------------------------------------------
   */

  transaction(
    "TX-025",
    `
Vendor: CloudStack Technologies
Category: SaaS
Total: ₹5,723
Invoice Date:
Department Code: ENG-001
    `,
    "FAIL",
    "CRITICAL",
    ["P-003"],
  ),

  transaction(
    "TX-026",
    `
Vendor: Office Supplies India
Category: Office Supplies
Total: ₹1,850
Invoice Date:
Department Code: OPS-002
    `,
    "FAIL",
    "CRITICAL",
    ["P-003"],
  ),

  transaction(
    "TX-027",
    `
Vendor: Royal Kitchen
Category: Meal
Total: ₹2,450
Invoice Date:
Department Code: HR-002
    `,
    "FAIL",
    "CRITICAL",
    ["P-003"],
  ),

  transaction(
    "TX-028",
    `
Vendor: DevTools Cloud
Category: Software
Total: ₹8,400
Invoice Date:
Department Code: ENG-003
    `,
    "FAIL",
    "CRITICAL",
    ["P-003"],
  ),

  transaction(
    "TX-029",
    `
Vendor: Metro Transport
Category: Transportation
Total: ₹3,200
Invoice Date:
Department Code: FIN-001
    `,
    "FAIL",
    "CRITICAL",
    ["P-003"],
  ),


  /*
   * ----------------------------------------------------------
   * MULTIPLE POLICY VIOLATIONS
   * ----------------------------------------------------------
   *
   * P-001 + P-002 = HIGH
   * P-001 + P-003 = CRITICAL
   * P-002 + P-003 = CRITICAL
   * P-001 + P-002 + P-003 = CRITICAL
   */

  transaction(
    "TX-030",
    `
Vendor: Executive Dining
Category: Meal
Total: ₹4,720
Invoice Date: 2026-08-05
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-031",
    `
Vendor: Business Bistro
Category: Meal
Total: ₹5,500
Invoice Date:
Department Code: SALES-004
    `,
    "FAIL",
    "CRITICAL",
    ["P-001", "P-003"],
  ),

  transaction(
    "TX-032",
    `
Vendor: Analytics Platform
Category: SaaS
Total: ₹12,000
Invoice Date:
Department Code:
    `,
    "FAIL",
    "CRITICAL",
    ["P-002", "P-003"],
  ),

  transaction(
    "TX-033",
    `
Vendor: Corporate Catering
Category: Meal
Total: ₹6,250
Invoice Date:
Department Code:
    `,
    "FAIL",
    "CRITICAL",
    ["P-001", "P-003"],
  ),

  transaction(
    "TX-034",
    `
Vendor: Software Dining Platform
Category: Meal Software
Total: ₹4,800
Invoice Date: 2026-08-04
Department Code:
    `,
    "FAIL",
    "HIGH",
    ["P-001", "P-002"],
  ),

  transaction(
    "TX-035",
    `
Vendor: SaaS Catering Platform
Category: Meal SaaS
Total: ₹4,250
Invoice Date:
Department Code:
    `,
    "FAIL",
    "CRITICAL",
    ["P-001", "P-002", "P-003"],
  ),


  /*
   * ----------------------------------------------------------
   * BOUNDARY / VARIATION CASES
   * ----------------------------------------------------------
   */

  transaction(
    "TX-036",
    `
Vendor: Lunch Corner
Category: MEAL
Total: ₹3,001
Invoice Date: 2026-08-03
Department Code: FIN-003
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-037",
    `
Vendor: Cloud Provider
Category: SAAS
Total: ₹6,700
Invoice Date: 2026-08-02
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-038",
    `
Vendor: Software Hub
Category: SOFTWARE
Total: ₹3,200
Invoice Date: 2026-08-01
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-039",
    `
Vendor: Team Lunch
Category: meal
Total: ₹3,000
Invoice Date: 2026-07-31
Department Code: ENG-005
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-040",
    `
Vendor: Team Lunch
Category: meal
Total: ₹3,000.01
Invoice Date: 2026-07-30
Department Code: ENG-005
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),


  /*
   * ----------------------------------------------------------
   * ADDITIONAL CLEAN TRANSACTIONS
   * ----------------------------------------------------------
   */

  transaction(
    "TX-041",
    `
Vendor: Hardware Depot
Category: Hardware
Total: ₹25,000
Invoice Date: 2026-07-29
Department Code: IT-004
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-042",
    `
Vendor: Learning Center
Category: Training
Total: ₹7,500
Invoice Date: 2026-07-28
Department Code: HR-005
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-043",
    `
Vendor: Taxi Network
Category: Transportation
Total: ₹2,700
Invoice Date: 2026-07-27
Department Code: SALES-006
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-044",
    `
Vendor: Hotel Services
Category: Accommodation
Total: ₹14,500
Invoice Date: 2026-07-26
Department Code: TRAVEL-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-045",
    `
Vendor: Marketing Studio
Category: Marketing
Total: ₹11,000
Invoice Date: 2026-07-25
Department Code: MKT-002
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-046",
    `
Vendor: Legal Advisors
Category: Professional Services
Total: ₹30,000
Invoice Date: 2026-07-24
Department Code: LEGAL-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-047",
    `
Vendor: Data Storage
Category: SaaS
Total: ₹2,500
Invoice Date: 2026-07-23
Department Code: DATA-001
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-048",
    `
Vendor: Design Tools
Category: Software
Total: ₹2,200
Invoice Date: 2026-07-22
Department Code: DESIGN-002
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-049",
    `
Vendor: Restaurant Group
Category: Meal
Total: ₹2,999
Invoice Date: 2026-07-21
Department Code: SALES-007
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-050",
    `
Vendor: Restaurant Group
Category: Meal
Total: ₹3,000
Invoice Date: 2026-07-20
Department Code: SALES-007
    `,
    "PASS",
    "LOW",
    [],
  ),


  /*
   * ----------------------------------------------------------
   * ADDITIONAL POLICY CASES
   * ----------------------------------------------------------
   */

  transaction(
    "TX-051",
    `
Vendor: Cloud Billing
Category: SaaS
Total: ₹3,600
Invoice Date: 2026-07-19
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-052",
    `
Vendor: Client Hospitality
Category: Meal
Total: ₹3,100
Invoice Date:
Department Code: SALES-008
    `,
    "FAIL",
    "CRITICAL",
    ["P-001", "P-003"],
  ),

  transaction(
    "TX-053",
    `
Vendor: Development Platform
Category: Software
Total: ₹9,800
Invoice Date:
Department Code:
    `,
    "FAIL",
    "CRITICAL",
    ["P-002", "P-003"],
  ),

  transaction(
    "TX-054",
    `
Vendor: Engineering Lunch
Category: Meal
Total: ₹7,000
Invoice Date:
Department Code:
    `,
    "FAIL",
    "CRITICAL",
    ["P-001", "P-003"],
  ),

  transaction(
    "TX-055",
    `
Vendor: Team Lunch
Category: Meal
Total: ₹3,001
Invoice Date: 2026-07-18
Department Code: ENG-006
    `,
    "FAIL",
    "MEDIUM",
    ["P-001"],
  ),

  transaction(
    "TX-056",
    `
Vendor: SaaS Platform
Category: SaaS
Total: ₹10,500
Invoice Date: 2026-07-17
Department Code:
    `,
    "FAIL",
    "MEDIUM",
    ["P-002"],
  ),

  transaction(
    "TX-057",
    `
Vendor: Consulting Group
Category: Consulting
Total: ₹22,000
Invoice Date:
Department Code: FIN-005
    `,
    "FAIL",
    "CRITICAL",
    ["P-003"],
  ),

  transaction(
    "TX-058",
    `
Vendor: Office Lunch
Category: Meal
Total: ₹2,800
Invoice Date: 2026-07-16
Department Code: OPS-004
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-059",
    `
Vendor: Cloud Infrastructure
Category: Software
Total: ₹18,500
Invoice Date: 2026-07-15
Department Code: ENG-007
    `,
    "PASS",
    "LOW",
    [],
  ),

  transaction(
    "TX-060",
    `
Vendor: Executive Dinner
Category: Meal
Total: ₹12,000
Invoice Date:
Department Code: EXEC-002
    `,
    "FAIL",
    "CRITICAL",
    ["P-001", "P-003"],
  ),
];


/*
 * ============================================================
 * DATASET SIZE CHECK
 * ============================================================
 */

if (EVALUATION_DATASET.length < 50) {
  throw new Error(
    "Evaluation dataset must contain at least 50 records.",
  );
}