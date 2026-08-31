# AI Finance Controller: Agentic Policy Engine

> **Gemini extracts facts. Deterministic application code decides policy compliance.**

An AI-powered financial expense auditing engine that combines LLM-based document extraction with deterministic financial controls.

The system extracts structured transaction data from invoices, receipts, and expense documents, validates the AI output, self-corrects malformed responses with a bounded retry, evaluates transactions against explicit company policies, calculates risk, and produces actionable audit recommendations.

The result is not simply an AI invoice extractor.

It is an **AI-assisted financial control system**.

---

## Why This Project?

Traditional invoice automation often focuses primarily on:

```text
Document
   ↓
OCR / Extraction
   ↓
Structured Data
```

That solves the extraction problem, but another important question remains:

> **Does this transaction comply with the company's financial policy?**

The AI Finance Controller extends the workflow:

```text
Document
   ↓
AI Extraction
   ↓
Schema Validation
   ↓
Self-Correction
   ↓
Deterministic Policy Enforcement
   ↓
Risk Assessment
   ↓
Recommendation
   ↓
Auditable Decision
```

The architecture deliberately separates probabilistic AI interpretation from deterministic financial controls.

---

# Core Design Principle

> **"Gemini extracts facts. Deterministic application code decides policy compliance."**

LLMs are effective at interpreting unstructured documents, but financial policy enforcement benefits from explicit and deterministic rules.

Therefore:

```text
                ┌───────────────────────┐
                │       Gemini          │
                │                       │
                │ Extract facts from    │
                │ unstructured documents│
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Schema Validation   │
                │                       │
                │ Is the AI response    │
                │ structurally valid?   │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ Deterministic Policy  │
                │       Engine          │
                │                       │
                │ Does the transaction  │
                │ comply with policy?   │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Recommendation      │
                │       Engine          │
                └───────────────────────┘
```

This prevents an LLM-generated compliance opinion from directly becoming the final financial decision.

---

# Key Differentiators

## 1. Deterministic Financial Controls

Policy decisions are evaluated in application code.

The LLM is not trusted to make the final compliance decision.

This makes the control layer:

- Predictable
- Testable
- Explainable
- Auditable

---

## 2. Agentic Self-Correction

The controller does not blindly trust the first AI response.

The generated JSON passes through client-side validation.

When Gemini produces malformed JSON or fails schema validation:

```text
Gemini Response
       ↓
JSON / Schema Validation
       │
       ├── VALID
       │     ↓
       │ Policy Engine
       │
       └── INVALID
             ↓
       Self-Correction
             ↓
       Gemini Retry #1
             ↓
       JSON / Schema Validation
             │
             ├── VALID
             │     ↓
             │ Policy Engine
             │
             └── INVALID
                   ↓
             Manual Review
```

The retry loop is intentionally limited to **one retry**.

This prevents uncontrolled API loops and unnecessary repeated model calls.

---

## 3. Exact Error-Context Correction

The self-correction prompt includes the actual validation failure.

The retry receives:

```text
Original document
        +
Previous Gemini response
        +
Exact validation error
```

For example:

```text
EXACT VALIDATION ERROR:

total_amount must be a finite number.
```

The model is then explicitly instructed to correct the structural problem and return only valid application JSON.

This makes the retry targeted rather than simply asking the model to "try again."

---

## 4. Fail-Closed Audit Behavior

The system distinguishes between AI-output validation failures and Gemini API failures.

### AI Output Failure

```text
Invalid JSON
     ↓
Self-Correction
     ↓
Retry #1
     ↓
Validation
```

### API Failure

```text
Quota / Authentication / Network Error
                ↓
             Stop
                ↓
       Recover / Retry Later
```

Quota errors are not treated as malformed AI output and do not enter the self-correction loop.

---

# Policy Engine

The controller currently enforces three policies.

## P-001 — Meal Expense Limit

Any meal expense above ₹3,000 must be flagged for review.

```text
Category = Meal
        +
Amount > ₹3,000
        ↓
P-001 VIOLATION
```

Example:

```text
Meal amount: ₹4,720
Policy limit: ₹3,000

Result:
FAIL

Policy:
P-001 — Meal Expense Limit

Risk:
MEDIUM
```

---

## P-002 — SaaS Department Code

Any software or SaaS expense must contain a department code.

```text
Software / SaaS
       +
Missing department_code
       ↓
P-002 VIOLATION
```

Example:

```text
Category:
SaaS

Department code:
Missing

Result:
FAIL

Policy:
P-002 — SaaS Department Code
```

---

## P-003 — Invoice Date Requirement

Every invoice must contain an invoice date.

```text
Missing invoice date
       ↓
P-003 VIOLATION
       ↓
CRITICAL RISK
```

---

# Policy Registry

Policies are represented as structured rules:

```text
┌────────┬────────────────────────────────────┐
│ P-001  │ Meal Expense Limit                 │
├────────┼────────────────────────────────────┤
│ P-002  │ SaaS Department Code               │
├────────┼────────────────────────────────────┤
│ P-003  │ Invoice Date Requirement            │
└────────┴────────────────────────────────────┘
```

Every deterministic policy violation contains:

```ts
{
  policy_id: string;
  policy_name: string;
  message: string;
}
```

This allows the audit interface to identify exactly which rule failed and why.

---

# Risk Assessment

The controller calculates an overall risk level from deterministic policy results.

Supported levels:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Current behavior:

```text
No violations
    ↓
LOW

One violation
    ↓
MEDIUM

Two or more violations
    ↓
HIGH

Missing invoice date
    ↓
CRITICAL
```

Critical invoice-date violations take precedence over the other risk levels.

---

# Recommendation Engine

After policy evaluation, the recommendation engine converts the policy result into an actionable financial-control recommendation.

### Clean transaction

```text
Approve automatically.
Transaction complies with current company policy.
```

### Policy violation

For example:

```text
Request an itemized receipt and obtain manager approval
before reimbursement.
```

The recommendation is derived from the deterministic policy result rather than allowing the LLM to independently determine the final business action.

---

# Agent Execution Timeline

The dashboard exposes the actual application-level execution lifecycle.

## Normal Execution

```text
Document Extraction
        ↓
JSON Validation
        ↓
Policy Evaluation
        ↓
Audit Completed
```

## Self-Correction Execution

```text
Document Extraction
        ↓
JSON Validation
        ↓
Self-Correction
        ↓
Gemini Retry #1
        ↓
2nd JSON Validation
        ↓
Policy Evaluation
        ↓
Audit Completed
```

## Unrecoverable Validation Failure

```text
Document Extraction
        ↓
JSON Validation
        ↓
Self-Correction
        ↓
Gemini Retry #1
        ↓
2nd JSON Validation
        ↓
INVALID
        ↓
Manual Review
```

The timeline exposes application-level events without attempting to expose private model reasoning or hidden chain-of-thought.

---

# Architecture Flow

```text
                          ┌──────────────────────┐
                          │         User         │
                          │   Invoice / Receipt  │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │    React Frontend    │
                          │ Transaction Document │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   Gemini API (BYOK)  │
                          │ Document Extraction  │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │    JSON / Schema     │
                          │     Validation       │
                          └──────────┬───────────┘
                                     │
                           ┌─────────┴─────────┐
                           │                   │
                        Invalid              Valid
                           │                   │
                           ▼                   │
                 ┌──────────────────┐          │
                 │ Self-Correction  │          │
                 │ Maximum 1 retry  │          │
                 └─────────┬────────┘          │
                           │                   │
                           ▼                   │
                 ┌──────────────────┐          │
                 │   Gemini Retry   │          │
                 │ + Error Context  │          │
                 └─────────┬────────┘          │
                           │                   │
                           ▼                   │
                 ┌──────────────────┐          │
                 │  2nd Validation  │          │
                 └─────────┬────────┘          │
                           │                   │
                         Valid                 │
                           │                   │
                           └──────────┐        │
                                      │        │
                                      ▼        │
                           ┌──────────────────────┐
                           │    Deterministic     │
                           │    Policy Engine     │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │   Risk Assessment    │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │    Recommendation    │
                           │        Engine        │
                           └──────────┬───────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │     Audit Result     │
                           │   + Agent Timeline   │
                           └──────────────────────┘

             If 2nd validation fails:
                         │
                         ▼
                ┌───────────────────┐
                │   Manual Review   │
                └───────────────────┘
```

---

# User Experience

The dashboard is designed as an enterprise-style financial control center.

## Header

Displays:

- AI Finance Controller
- Agentic Policy Engine
- Gemini API BYOK status
- Local browser storage indication

---

## Policy Panel

Displays the active company policies:

```text
P-001
Meal Expense Limit
Maximum ₹3,000

P-002
SaaS Department Code
Department code required

P-003
Invoice Date Requirement
Invoice date required
```

---

## Transaction Input

Users can paste:

- Invoices
- Receipts
- Expense records
- Structured or semi-structured transaction text

---

## Audit Dashboard

The dashboard provides:

- Total amount processed
- Policy violation count
- Clean transaction count
- Audit results
- Policy status
- Risk level
- Actionable insights

---

## Detailed Audit Drawer

Each audit can be opened for detailed inspection.

The drawer exposes:

```text
Transaction Summary
        ↓
Policy Evaluation
        ↓
Policy IDs
        ↓
Risk Level
        ↓
Strategic Recommendation
        ↓
Raw Agent JSON
        ↓
Original Document
```

This creates a visible audit trail from source document to final policy decision.

---

# Example Audit

## Clean SaaS Transaction

```text
Vendor:
CloudStack Technologies

Category:
SaaS

Total:
₹5,723

Department Code:
ENG-001

Invoice Date:
2026-08-28
```

Result:

```text
PASS
LOW RISK

P-001 ✓
P-002 ✓
P-003 ✓

Recommendation:
Approve automatically.
```

---

## Meal Policy Violation

```text
Vendor:
Royal Kitchen

Category:
Meal

Total:
₹4,720

Department Code:
HR-002

Invoice Date:
2026-08-29
```

Result:

```text
FAIL
MEDIUM RISK

P-001 ✕

Meal Expense Limit

Meal expense of ₹4,720 exceeds
the ₹3,000 limit.

Recommendation:
Request an itemized receipt and obtain
manager approval before reimbursement.
```

---

# Bring Your Own Key (BYOK)

The current application uses a **Bring Your Own Key** model.

Users provide their own Gemini API key.

```text
User
 │
 │ Own Gemini API Key
 ▼
React Frontend
 │
 ▼
Gemini API
```

The application does not provide a centralized Gemini API key.

The current implementation stores the supplied key in browser local storage for convenience.

## Important Security Limitation

This is a browser-based application.

A client-side API key cannot be treated as a server-side secret because the browser user can inspect client-side storage and network requests.

The current BYOK architecture is therefore best suited to:

- Local development
- Demonstrations
- Personal projects
- Controlled client-side deployments

For a production architecture requiring centralized authentication, stronger secret management, organization-level access control, or server-side governance, Gemini requests should be moved behind a backend/API layer.

Recommended production architecture:

```text
React Frontend
      │
      ▼
Backend / API Gateway
      │
      ▼
Gemini API
```

---

# Data Handling

The current client-side application does not operate an intermediate application backend or application database for audit records.

Transaction information is sent directly from the browser to Gemini using the user's own API key.

Provider-side data handling remains subject to the policies and configuration of the Gemini / Google Cloud project being used.

The application does not make independent guarantees about provider-side retention.

---

# Technology Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

## AI

- Google Gemini API
- Gemini 3.6 Flash

## Application Services

- AI Agent Service
- JSON / Schema Validator
- Deterministic Policy Engine
- Policy Registry
- Risk Assessment
- Recommendation Engine
- Agent Execution Timeline

---

# Project Structure

```text
ai-finance-controller/
│
├── public/
│
├── src/
│   │
│   ├── components/
│   │   ├── AgentActivity.tsx
│   │   ├── AuditTable.tsx
│   │   ├── Header.tsx
│   │   ├── Metrics.tsx
│   │   ├── PolicyPanel.tsx
│   │   └── ResultDrawer.tsx
│   │
│   ├── services/
│   │   ├── aiAgent.ts
│   │   ├── policyEngine.ts
│   │   └── recommendationEngine.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

# Getting Started

## Prerequisites

You need:

- Node.js
- npm
- A Gemini API key

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Enter the project directory:

```bash
cd ai-finance-controller
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide the local development URL.

---

# Using the Application

## 1. Enter Your Gemini API Key

Enter the key in:

```text
Gemini API • BYOK
```

The key is stored locally in the browser.

---

## 2. Paste Transaction Data

Example:

```text
Vendor: CloudStack Technologies
Invoice Number: CST-2026-0912
Date: 2026-08-28
Department Code: ENG-001

Description:
Annual SaaS infrastructure subscription

Subtotal: ₹4,850
Tax: ₹873

Total: ₹5,723
```

---

## 3. Run the Audit

Click:

```text
Run Audit
```

The controller executes the complete audit pipeline:

```text
Extraction
    ↓
Validation
    ↓
Policy Evaluation
    ↓
Risk Assessment
    ↓
Recommendation
```

---

## 4. Review the Decision

Inspect:

- Policy status
- Risk level
- Violated policy
- Recommendation
- Raw agent output
- Original document

---

# Test Scenarios

## Scenario 1 — Clean Transaction

```text
Category: SaaS
Department Code: ENG-001
Invoice Date: Present
```

Expected:

```text
PASS
LOW
```

---

## Scenario 2 — P-001

```text
Category: Meal
Amount: ₹4,720
```

Expected:

```text
FAIL
P-001
MEDIUM
```

---

## Scenario 3 — P-002

```text
Category: SaaS
Department Code: Missing
```

Expected:

```text
FAIL
P-002
MEDIUM
```

---

## Scenario 4 — P-003

```text
Invoice Date: Missing
```

Expected:

```text
FAIL
P-003
CRITICAL
```

---

## Scenario 5 — Self-Correction

When a malformed AI response is encountered:

```text
Validation Failure
       ↓
Self-Correction
       ↓
Retry #1
       ↓
Validation
       ↓
Policy Evaluation
```

If the second validation also fails:

```text
Validation Failure
       ↓
Manual Review
```

---

# Error Handling

The controller distinguishes between input, AI-output, and API errors.

## Missing API Key

```text
Please enter your Gemini API key.
```

## Invalid Authentication

```text
Gemini API authentication failed.
Please check your API key.
```

## Quota / Rate Limit

```text
Gemini quota or rate limit reached.
Please try again after the quota resets.
```

## Network Failure

```text
Unable to reach the Gemini API.
Please check your internet connection and try again.
```

## Unrecoverable AI Validation Failure

```text
The AI response could not be validated after
the allowed self-correction attempt.
Manual review is required.
```

---

# Engineering Principles

## Separate Probabilistic and Deterministic Responsibilities

Use AI for interpretation.

Use deterministic code for policy enforcement.

---

## Fail Closed

An invalid AI response should never silently become a financial approval.

---

## Bound Agent Loops

Self-correction is useful, but unlimited retries are dangerous.

The current implementation allows:

```text
Maximum retries = 1
```

---

## Make Decisions Explainable

A financial control system should be able to answer:

```text
What failed?
Which policy failed?
What was the observed value?
What risk level was assigned?
What action is recommended?
```

The audit drawer is designed around these questions.

---

# Current Limitations

The current version is intentionally client-side.

Known limitations:

- Gemini requests originate in the browser.
- The user's API key is stored in browser local storage.
- There is no backend authentication service.
- There is no persistent server-side audit database.
- Policies are currently defined in application code.
- There is no organization/tenant management layer.
- Role-based access control is not implemented.
- Centralized approval workflows are not implemented.
- Server-side secret management is not implemented.

These limitations are explicit boundaries of the current architecture.

---

# Future Architecture

A larger production deployment could evolve toward:

```text
                       ┌─────────────────────┐
                       │   Web Application   │
                       │      React UI       │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │    API Gateway      │
                       └──────────┬──────────┘
                                  │
                  ┌───────────────┼────────────────┐
                  │               │                │
                  ▼               ▼                ▼
          ┌────────────┐  ┌────────────┐   ┌──────────────┐
          │ AI Agent   │  │  Policy    │   │ Audit Store  │
          │ Service    │  │  Service   │   │              │
          └──────┬─────┘  └─────┬──────┘   └──────────────┘
                 │              │
                 ▼              ▼
            Gemini API     Policy Registry
```

Possible extensions include:

- Authentication
- Role-based access control
- Organization-level policies
- Policy versioning
- Persistent audit history
- Approval workflows
- Department analytics
- Vendor analytics
- Spending intelligence
- Compliance reporting
- Centralized model/API management

---

# Development Commands

Start development:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

---

# Project Philosophy

```text
Use AI where interpretation is difficult.
Use deterministic software where decisions must be reliable.
```

The AI Finance Controller applies this principle to financial auditing:

```text
Unstructured document
        ↓
AI interpretation
        ↓
Structured data
        ↓
Deterministic controls
        ↓
Risk
        ↓
Action
        ↓
Audit trail
```

The goal is not to replace financial controls with AI.

The goal is to use AI to make existing controls **faster, more scalable, and easier to operate — without giving up deterministic enforcement.**

---

# Current Implementation Status

The current implementation includes:

- AI document extraction
- Gemini integration
- Structured JSON validation
- One-retry self-correction
- Exact validation-error feedback
- Deterministic policy engine
- P-001 / P-002 / P-003
- Risk assessment
- Recommendation engine
- Agent execution timeline
- Audit dashboard
- Detailed audit drawer
- Raw JSON inspection
- Original-document inspection
- BYOK API-key architecture
- Friendly API error handling
- ESLint validation
- Production build validation

---

## License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for the full license text.

