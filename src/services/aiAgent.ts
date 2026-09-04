import type {
  AgentStatus,
  ExtractedInvoiceFacts,
  InvoiceResult,
  LLMConfig,
} from "../types";

import {
  evaluatePolicy,
} from "./policyEngine";

import {
  generateRecommendation,
} from "./recommendationEngine";

import {
  callLLM,
  LLMApiError,
} from "./llm/llmClient";

import {
  INVOICE_EXTRACTION_SCHEMA,
} from "./llm/extractionSchema";


const MAX_RETRIES = 1;


/*
 * ============================================================
 * AGENT EVENTS
 * ============================================================
 *
 * Keep the existing event contract used by App.tsx.
 */

export interface AgentStatusEvent {
  type: "status";
  status: AgentStatus;
  message: string;
}


export interface AgentRetryEvent {
  type: "retry";
  message: string;
  attempt: number;
}


export type AgentEvent =
  | AgentStatusEvent
  | AgentRetryEvent;


export type AgentEventHandler =
  (event: AgentEvent) => void;


/*
 * ============================================================
 * VALIDATION ERROR
 * ============================================================
 */

export class InvoiceValidationError
  extends Error {

  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "InvoiceValidationError";
  }
}


/*
 * ============================================================
 * VALIDATE EXTRACTED FACTS
 * ============================================================
 */

function validateExtractedInvoiceFacts(
  value: unknown,
): ExtractedInvoiceFacts {

  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new InvoiceValidationError(
      "LLM response must be a JSON object.",
    );
  }


  const data =
    value as Record<string, unknown>;


  if (
    typeof data.vendor_name !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "vendor_name must be a string.",
    );
  }


  if (
    typeof data.total_amount !==
      "number" ||
    !Number.isFinite(
      data.total_amount,
    )
  ) {
    throw new InvoiceValidationError(
      "total_amount must be a finite number.",
    );
  }


  if (
    typeof data.category !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "category must be a string.",
    );
  }


  if (
    typeof data.invoice_date !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "invoice_date must be a string.",
    );
  }


  if (
    typeof data.department_code !==
    "string"
  ) {
    throw new InvoiceValidationError(
      "department_code must be a string.",
    );
  }


  return {
    vendor_name:
      data.vendor_name.trim(),

    total_amount:
      data.total_amount,

    category:
      data.category.trim(),

    invoice_date:
      data.invoice_date.trim(),

    department_code:
      data.department_code.trim(),
  };
}


/*
 * ============================================================
 * STRIP CODE FENCES
 * ============================================================
 */

function stripCodeFences(
  text: string,
): string {

  const trimmed =
    text.trim();


  if (
    !trimmed.startsWith("```")
  ) {
    return trimmed;
  }


  return trimmed
    .replace(
      /^```(?:json)?\s*/i,
      "",
    )
    .replace(
      /\s*```$/,
      "",
    )
    .trim();
}


/*
 * ============================================================
 * PARSE LLM RESPONSE
 * ============================================================
 */

function parseInvoiceResponse(
  text: string,
): ExtractedInvoiceFacts {

  const cleaned =
    stripCodeFences(text);


  let parsed: unknown;


  try {
    parsed =
      JSON.parse(cleaned);
  } catch {
    throw new InvoiceValidationError(
      "LLM response was not valid JSON.",
    );
  }


  return validateExtractedInvoiceFacts(
    parsed,
  );
}


/*
 * ============================================================
 * INITIAL EXTRACTION PROMPT
 * ============================================================
 */

function buildInitialPrompt(
  invoiceText: string,
): string {

  return `
You are the extraction component of an AI Finance Controller.

Your ONLY responsibility is to extract factual information
from the supplied invoice or expense document.

Do NOT decide whether any financial policy was violated.

Do NOT calculate risk.

Do NOT generate a compliance decision.

Do NOT generate policy violations.

Do NOT generate recommendations.

Do NOT invent information that is not present.

If a field is missing from the source document, return an
empty string for that field.

The application will independently evaluate all financial
policies after extraction.

Return EXACTLY one JSON object matching this schema:

${JSON.stringify(
  INVOICE_EXTRACTION_SCHEMA,
  null,
  2,
)}

Required fields:

- vendor_name: string
- total_amount: number
- category: string
- invoice_date: string
- department_code: string

Rules:

1. total_amount must be a number.
2. Do not include currency symbols inside total_amount.
3. Preserve the invoice date when present.
4. Preserve department codes when present.
5. Use an empty string when invoice_date is missing.
6. Use an empty string when department_code is missing.
7. Do not return Markdown.
8. Do not return explanations.
9. Do not return additional fields.

SOURCE DOCUMENT:

${invoiceText}
`.trim();
}


/*
 * ============================================================
 * CORRECTION PROMPT
 * ============================================================
 */

function buildCorrectionPrompt(
  invoiceText: string,
  previousResponse: string,
  validationError: string,
): string {

  return `
The previous extraction response was invalid.

You are the extraction component of an AI Finance Controller.

Your ONLY responsibility is to extract factual information
from the source document.

Do NOT evaluate financial policies.

Do NOT calculate risk.

Do NOT generate policy violations.

Do NOT generate recommendations.

Return EXACTLY one JSON object matching this schema:

${JSON.stringify(
  INVOICE_EXTRACTION_SCHEMA,
  null,
  2,
)}

Validation error:

${validationError}

Previous response:

${previousResponse}

Source document:

${invoiceText}

Return ONLY the corrected JSON object.
`.trim();
}


/*
 * ============================================================
 * UI TIMING
 * ============================================================
 */

function waitForUIUpdate(
  milliseconds: number,
): Promise<void> {

  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds,
      ),
  );
}


/*
 * ============================================================
 * PROCESS INVOICE
 * ============================================================
 */

export async function processInvoice(
  invoiceText: string,
  llmConfig: LLMConfig,
  onEvent?: AgentEventHandler,
): Promise<InvoiceResult> {

  if (
    !invoiceText.trim()
  ) {
    throw new Error(
      "Invoice text is required.",
    );
  }


  if (
    !llmConfig.endpoint.trim()
  ) {
    throw new Error(
      "LLM endpoint is required.",
    );
  }


  let attempt = 0;

  let previousResponse = "";


  while (
    attempt <= MAX_RETRIES
  ) {

    try {

      /*
       * --------------------------------------------------------
       * EXTRACTION
       * --------------------------------------------------------
       */

      onEvent?.({
        type: "status",

        status: "extracting",

        message:
          "Sending invoice to the configured LLM for fact extraction.",
      });


      const prompt =
        attempt === 0
          ? buildInitialPrompt(
              invoiceText,
            )
          : buildCorrectionPrompt(
              invoiceText,
              previousResponse,
              "The previous response failed schema validation.",
            );


      const response =
        await callLLM(
          prompt,
          llmConfig,
        );


      previousResponse =
        response;


      /*
       * --------------------------------------------------------
       * VALIDATION
       * --------------------------------------------------------
       */

      onEvent?.({
        type: "status",

        status: "validating",

        message:
          "Validating the extracted invoice facts.",
      });


      await waitForUIUpdate(
        1200,
      );


      let facts:
        ExtractedInvoiceFacts;


      try {

        facts =
          parseInvoiceResponse(
            response,
          );

      } catch (
        error
      ) {

        if (
          !(
            error instanceof
            InvoiceValidationError
          )
        ) {
          throw error;
        }


        if (
          attempt >= MAX_RETRIES
        ) {
          throw error;
        }


        /*
         * ------------------------------------------------------
         * SELF-CORRECTION
         * ------------------------------------------------------
         */

        onEvent?.({
          type: "retry",

          message:
            "The LLM response did not match the required schema. Retrying with a correction prompt.",

          attempt:
            attempt + 1,
        });


        await waitForUIUpdate(
          1200,
        );


        attempt++;

        continue;
      }


      /*
       * --------------------------------------------------------
       * DETERMINISTIC POLICY EVALUATION
       * --------------------------------------------------------
       */

      onEvent?.({
        type: "status",

        status: "evaluating",

        message:
          "Applying deterministic financial policies.",
      });


      await waitForUIUpdate(
        1200,
      );


      /*
       * Convert extracted facts into the
       * InvoiceResult shape expected by
       * the deterministic policy engine.
       *
       * The policy engine itself remains
       * completely independent of the LLM.
       */

      const policyInput:
        InvoiceResult = {

        vendor_name:
          facts.vendor_name,

        total_amount:
          facts.total_amount,

        category:
          facts.category,

        invoice_date:
          facts.invoice_date,

        department_code:
          facts.department_code,

        policy_violation:
          false,

        violation_details:
          [],

        violations:
          [],

        strategic_recommendation:
          "",

        risk_level:
          "LOW",
      };


      const policyEvaluation =
        evaluatePolicy(
          policyInput,
        );


      /*
       * --------------------------------------------------------
       * STRATEGIC RECOMMENDATION
       * --------------------------------------------------------
       *
       * The recommendation engine consumes:
       *
       * 1. violation_details
       * 2. deterministic risk level
       *
       * It does not receive the complete
       * PolicyEvaluation object.
       */

      const strategicRecommendation =
        generateRecommendation(
          policyEvaluation.violation_details,
          policyEvaluation.risk_level,
        );


      /*
       * --------------------------------------------------------
       * FINAL RESULT
       * --------------------------------------------------------
       */

      const finalResult:
        InvoiceResult = {

        ...facts,

        policy_violation:
          policyEvaluation.policy_violation,

        violation_details:
          policyEvaluation.violation_details,

        violations:
          policyEvaluation.violations,

        strategic_recommendation:
          strategicRecommendation,

        risk_level:
          policyEvaluation.risk_level,
      };


      /*
       * --------------------------------------------------------
       * COMPLETE
       * --------------------------------------------------------
       */

      onEvent?.({
        type: "status",

        status: "complete",

        message:
          "Audit completed successfully.",
      });


      return finalResult;

    } catch (
      error
    ) {

      /*
       * API errors are not schema errors.
       *
       * Never send them through self-correction.
       */

      if (
        error instanceof
        LLMApiError
      ) {

        onEvent?.({
          type: "status",

          status: "error",

          message:
            error.message,
        });

        throw error;
      }


      /*
       * Validation errors generated outside
       * the inner extraction validation block
       * should also fail closed.
       */

      if (
        error instanceof
        InvoiceValidationError
      ) {

        onEvent?.({
          type: "status",

          status: "error",

          message:
            error.message,
        });

        throw error;
      }


      onEvent?.({
        type: "status",

        status: "error",

        message:
          error instanceof Error
            ? error.message
            : "Unexpected audit error.",
      });


      throw error;
    }
  }


  throw new Error(
    "Unable to complete invoice extraction.",
  );
}